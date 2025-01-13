const express = require('express')

const userModel = require('./models/user.models.js')
const postModel = require('./models/post.models.js')
const path = require('path')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

const app = express();
app.use(cookieParser())

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.get('/',(req,res) =>{
    res.render('index');
})
app.get('/login',(req,res) =>{
    res.render('login');
})

app.get('/profile',isLoggedIn, async (req,res) =>{
    let user = await userModel.findOne({email: req.user.email}).populate("posts")
    res.render('profile',{user})
})
app.get('/like/:id',isLoggedIn, async (req,res) =>{
    let post = await postModel.findOne({_id: req.params.id}).populate("user")
    // console.log(req.params.id)
    // console.log(req.user.userid)
    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid)
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1)
    }
    await post.save()
    res.redirect('/profile')
})
app.get('/edit/:id',isLoggedIn, async (req,res) =>{
    let post = await postModel.findOne({_id: req.params.id}).populate("user")
    
    res.render('edit' ,{post})
})
app.post('/update/:id',isLoggedIn, async (req,res) =>{
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content})
    
    res.redirect('/profile')
})
app.get('/delete/:id',isLoggedIn, async (req,res) =>{
    let post = await postModel.findOneAndDelete({_id: req.params.id})
    res.redirect('/profile')
})

app.post('/post',isLoggedIn, async (req,res) =>{
    let user = await userModel.findOne({email: req.user.email})
    const {content} = req.body
    const post = await postModel.create({
        user: user._id,
        content
    })

    user.posts.push(post._id)
    await user.save()
    res.redirect('/profile')
})
app.post('/register', async (req,res) =>{
    let {name,username,email,password,age} = req.body;

    let user = await userModel.findOne({email})
    if(user){
        return res.status(500).send('User already register')
    }
    bcrypt.genSalt(10, (err, salt) =>{
        console.log(salt);
        bcrypt.hash(password, salt, async (err,hash) =>{
            let user = await userModel.create({
                name,
                username,
                email,
                password: hash,
                age
            })

            const token = jwt.sign({email: email,userid: user._id},"shhhhh")
            res.cookie('token',token)
            res.redirect('/profile')
        })
    })

    // console.log(req.body);
    
})

app.post('/login', async (req,res) =>{
    const {email,password} = req.body;
    const user = await userModel.findOne({email});
    if(!user){
        return res.status(500).send('Somthong went wrong');
    }
    
    bcrypt.compare(password, user.password, (err,result) =>{
        if(result){
            const token = jwt.sign({email: email,userid: user._id},"shhhhh")
            res.cookie('token',token)
            res.status(200).redirect("/profile");

        }
        else{
            return res.redirect('/login')
        }
    })
})

app.get('/logout', (req,res) =>{
    res.cookie('token', '')
    res.redirect('login')
})

function isLoggedIn(req,res,next){
    if(req.cookies.token === '') res.redirect('/login')
    else{
        let data = jwt.verify(req.cookies.token,"shhhhh")
        req.user = data;
    }
    next();
}




app.listen(3000,()=>{
    console.log('server start at port no. 3000');
});