const express = require('express');
const mongoose = require ('mongoose');
const methodoverride = require('method-override');
const {body, validationresult} = require('express-validator');
const path = require ('path');
const app = express();

mongoose.connect('mongodb+srv://test:test@cluster0.vkjnqsh.mongodb.net/database?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
    name : String,
    age : Number,
    email : String 
});
const User = mongoose.model('User' , userSchema);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({extended : false}));
app.use(methodoverride('_method'));
app.set('view engine','ejs');

//Get all users
app.get('/user/new', (req,res)=>{
    res.render('new-user',{user: {}, errors: null});
});

//post new user
app.post('/user',[
    body('name').isLength({min: 4}).withMessage('Name is required with min 4 chars'),
    body('age').isInt({min: 18}).withMessage('Age must be greater than 18 years'),
    body('email').isEmail().withMessage('Invalid email address')
], async(req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.render('new-user', { user: req.body, errors: errors.array() });
    }
    try {
        const user = new User(req.body);
        await user.save();
        console.log('User saved:', user);
        res.redirect('/user');
    } catch (error) {
        console.error('Error saving user:', error); 
        res.status(500).send(error);
    }
});

app.get('/user', async (req, res) => {
    try {
        const users = await User.find();
        res.render('user-list', { users });
    } catch (error) {
        res.status(500).send(error);
    }
});


app.get('/user/:id/edit', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('edit-user', { user, errors: null });
    } catch (error) {
        res.status(500).send(error);
    }
});


app.put('/user/:id', [
    body('name').isLength({ min: 4 }).withMessage('Name is required with min 4 chars'),
    body('age').isInt({ min: 18 }).withMessage('Age must be a number greater than 18'),
    body('email').isEmail().withMessage('Invalid email Address')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Fetch the user again to prefill the form with existing values
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        return res.render('edit-user', { user, errors: errors.array() });
    }
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.redirect('/user');
    } catch (error) {
        res.status(500).send(error);
    }
});


//Delete any user
app.delete('/user/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.redirect('/user');
    } catch (error) {
        res.status(500).send(error);
    }
});

const PORT = 2005;
app.listen(PORT, () => {
    console.log(`Mongodb Server is running on port ${PORT}`);
});


