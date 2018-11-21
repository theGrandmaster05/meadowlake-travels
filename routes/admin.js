const express = require('express')
    , router = express.Router()
    , app = express()
    , passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy
    , User = require('../models/user')
    , path = require('path')
    , { ensureUserIsAdmin } = require('../helpers/auth')
    , multer = require('multer')
    , multerUploads = multer({ dest: 'uploads/'});

app.use(require('body-parser').urlencoded({ extended: false }));

//importing models
let Product = require('../models/product');
//setting storage
const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage
}).array('pImages',3)

router.use(passport.initialize());
router.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser((id, done) => {
    User.getUserById(id, (err, user) => {
        done(err, user);
    });
});
passport.use(new LocalStrategy({ usernameField: 'email', passReqToCallback: true }, (req, username, password, done) => {
    User.getUserByEmail(username, (err, user) => {
        if (err) throw err;
        if (!user) {
            console.log('Unknown User');
            return done(null, false, { message: 'Unknown User' });
        };
        User.comparePassword(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
                console.log('Successful');
                return done(null, user);
            } else {
                console.log('Invalid Password');
                return done(null, false, { message: 'Invalid Password' });
            }
        });

    });
}));

router.get('*', (req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

router.get('/login', (req, res) => {
    res.render('admin/login', {
        title: 'Admin Login',
        isAdminPage: 'isAdminPage'
    });
});

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/products', failureFlash: "Invalid Username and/or password"
}), (req, res) => {
    if (req.user.isAdmin === 'admin') {
        console.log('Admin Authentication Successful');
        req.flash('Success', 'You are successfully logged in');
        res.redirect(302, '/admin');
    } else {
        console.log('You are not an admin')
        res.redirect(302, '../user/login');
    }
});

router.get('/admin-logout', (req, res) => {
    req.logout();
    console.log('You are logged out as an admin')
    req.flash('LoggedOut', 'You are logged out');
    res.redirect(302, '/admin/login');
});

router.get('/', ensureUserIsAdmin, (req,res) => {
    res.render('admin/index', {
        isAdminPage: 'isAdminPage',
        dashboard: 'dashboard'
    });
});

router.get('/dashboard',ensureUserIsAdmin, (req,res) => {
    res.render('admin/dashboard', {
        isAdminPage: 'isAdminPage'
    });
})

router.get('/edit/:id',ensureUserIsAdmin, (req,res) => {
    res.render('admin/edit_product');
});

router.get('/edit-account',ensureUserIsAdmin, (req,res) => {
    res.render('admin/edit_profile');
});

router.get('/post', ensureUserIsAdmin, (req,res) => {
    res.render('admin/post_product', {
        isAdminPage: 'isAdminPage',
        postProduct: 'postProduct'
    });
});

router.post('/postProduct',upload, (req,res) => {
    let title = req.body.title;
    let price = req.body.price;
    let color = req.body.color;
    let description = req.body.description;
    let image = req.files;

    //checking for validation
    req.checkBody('title', 'Ma\'am the product must have a title, might I suggest *Aso-Ebi*').notEmpty();
    req.checkBody('price', 'And the product also must have a price').notEmpty();
    req.checkBody('price', 'And the product price must also be a number').isNumeric();
    req.checkBody('description', 'The description field should not be left empty').notEmpty();
    req.checkBody('color', 'People would love to know what color the clothe is').notEmpty();

    //validation errors
    let postErrors = req.validationErrors();
    if (postErrors) {
        res.render('admin/post_product', {
            errors: postErrors,
            title: 'Post Product',
            ptitle: title,
            price: price,
            description: description,
            color: color
        });
    }
    let newProduct = new Product({
        title: title,
        description: description,
        price: price,
        color: color,
        imagePath1: `/uploads/${image[0].filename}`,
        imagePath2: `/uploads/${image[1].filename}`,
        imagePath3: `/uploads/${image[2].filename}`
    });
    Product.postProduct(newProduct, (err, product) => {
        if (err) {
            console.log(`Images didnt upload for the following reasons ${err}`)
        };
        console.log(product);
    });
});

router.post('/post', ensureUserIsAdmin, (req, res) => {
    let image = [];
    let files = req.files;
    let title = req.body.title;
    let price = req.body.price;
    let description = req.body.description;
    let color = req.body.color;
    console.log(title);
    console.log(files);
    req.checkBody('title','Ma\'am the product must have a title, might I suggest *Aso-Ebi*').notEmpty();
    req.checkBody('price','And the product also must have a price').notEmpty();
    req.checkBody('price','And the product price must also be a number').isNumeric();
    req.checkBody('description','The description field should not be left empty').notEmpty();
    req.checkBody('color','People would love to know what color the clothe is').notEmpty();
    
    let postErrors = req.validationErrors();

    
    // if (postErrors) {
    //     res.render('admin/post_product', {
    //         errors: postErrors,
    //         title: 'Post Product',
    //         ptitle: title,
    //         price: price,
    //         description: description,
    //         color: color
    //     });
    // }
    // if(req.body && req.files) {
    //     console.log(req.body);
    //     console.log(req.files);
    //     upload(req, res, err => {
    //         if (err) {
    //             res.render('admin/post_product', {
    //                 title: 'Post Product',
    //                 ptitle: title,
    //                 price: price,
    //                 description: description,
    //                 color: color,
    //                 msg: err,
    //                 isAdminPage: 'isAdminPage'
    //             });
    //             return;
    //         };
    //     });
    //     if(req.files){
    //         console.log(req.files);
    //         for (let i = 0; i <= 3; i++) {
    //             image[i] = req.files[i];
    //         }
    //         let newProduct = new Product({
    //             title: title,
    //             description: description,
    //             price: price,
    //             color: color,
    //             imagePath1: `/uploads/${image[0].filename}`,
    //             imagePath2: `/uploads/${image[1].filename}`,
    //             imagePath3: `/uploads/${image[2].filename}`
    //         });
    //         Product.postProduct(newProduct, (err, product) => {
    //             if (err) {
    //                 console.log(`Images didnt upload for the following reasons ${err}`)
    //             };
    //             console.log(newProduct);
    //         });
    //     }
    // }
    // if(req.files) {
    //     req.flash('uploading','Uploading image...');
    // } else {
    //     // 
    // }
});

// router.get('/register', (req, res) => {
//     res.render('admin/register', {
//         title: 'Admin Register'
//     });
// });

// router.post('/register',(req,res) => {
//     let email = req.body.email;
//     let name =  req.body.name;
//     let password = req.body.password;
//     let password2 = req.body.password;

//     //form validation
//     req.checkBody('email', 'Email field is required').notEmpty();
//     req.checkBody('email', 'Please enter a valid email').isEmail();
//     req.checkBody('name', 'name field is required').notEmpty();
//     req.checkBody('password', 'Password is required').notEmpty();
//     req.checkBody('password2', 'Passwords don\'t match').equals(password);

//     //checking for errors
//     let errors = req.validationErrors();
//     if (errors) {
//         res.render('admin/register', {
//             errors: errors,
//             title: 'Admin Register',
//             email: email,
//             name: name,
//             password: password,
//             password2: password2
//         });
//     } else {
//         User.getUserByEmail(email, (err, itExists) => {
//             if (err) throw err;
//             if (itExists) {
//                 console.log('Email already exists');
//                 let emailExistsError = "Email already exists";
//                 res.render('admin/register', {
//                     emailExists: emailExistsError,
//                     title: 'Admin Register',
//                     email: email,
//                     password: password,
//                     password2: password2
//                 });
//             } else {
//                 let newUser = new User({
//                     email: email,
//                     name: name,
//                     isAdmin: 'admin',
//                     password: password
//                 });

//                 //create user
//                 User.createUser(newUser, (err, user) => {
//                     if (err) throw err;
//                     console.log(user);
//                 });
//                 req.flash('success', 'You are registered');
//                 res.location('/');
//                 res.redirect(302, '/admin/login');
//             }
//         });
//     }    
// });


module.exports = router;