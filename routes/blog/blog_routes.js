const express = require('express');
const router = express.Router();

const posts = [
    {id:1,title:"Hello Express"},
    {id:2,title:"Tips on Using Express JS"}
]; 

router.get(`/`, (req, res) => {
    // res.send('All blog posts' );
    res.render("blogs", {title: "My Blogs", posts});
});

router.get(`/:id`, (req, res) => {
    res.send( `Currently viewing blog post id: ` + req.params.id);
});

module.exports = router;
