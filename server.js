const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');
const corsOptions = {
    origin: ['http://localhost:4200', ''], //allowed origins
    methods: 'GET,HEAD,POST,PATCH,PUT,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type','Authorization']
}
app.use(cors(corsOptions));

app.engine( 'ejs', require( 'ejs' ).__express);
app.set('view engine','ejs');
app.set('views', path.join( __dirname, 'views'));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const methodOverride = require( 'method-override' );
app.use( methodOverride( '_method' ));

app.get('/',(req,res) => {
    res.send('Hello Express!');
});

// GET request
app.get( '/about', (req, res) => {
  res.send( 'You are viewing about us page' );
});

app.get(`/products/:id`, (req,res) => {
    const {id} = req.params;
    res.send(`Product id: ` + id);
})

app.get(`/search`, (req,res) => {
    const {keyword,page} = req.query;
    res.send(`Search: ` + keyword + `(page: ` + page + `)` )
});

const blogRoutes = require(`./routes/blog/blog_routes`);
app.use(`/blogs`, blogRoutes);

const contactRoutes = require(`./routes/contacts/contacts_route`);
app.use(`/contacts`,contactRoutes);

const userRoutes = require(`./routes/users/users_route`);
app.use( '/users', userRoutes );

const reportApiRoutes = require("./routes/api/report_api_routes");
app.use("/api/reports", reportApiRoutes);

app.use(
  "/api/files/images",
  express.static(path.join(__dirname, "files/images"))
);

const authApiRoutes = require( './routes/api/auth_api_routes' );
app.use( '/api/auth', authApiRoutes );



app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));