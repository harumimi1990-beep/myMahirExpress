const express = require('express');
const router = express.Router();

const contacts = [
    {id:1,name:"Ali",phone:"0123456789"},
    {id:2,name:"Abu",phone:"0179374628"},
    {id:3,name:"Ahmad",phone:"015e4283529"}
];

router.get(`/`, (req, res) => {
    res.render(`contact/contacts`, {
        title: "My contact list",
        content: "Manage and view details",
        contacts
    });
});

function renderFormPage (res, error=null){
    res.render('contact/contact_form',{
        title: "Add New Contact",
        content: "Fill in the details",
        error,
        formAction:'/contacts/add'
    });
}

router.get("/add", (req, res) => {
    renderFormPage(res);
});

router.post(`/add`, (req,res) => {
    const {name,phone} = req.body;
    const newContact = {
        id: contacts.length+1,
        name,
        phone
    }
    contacts.push(newContact);
    res.redirect('/contacts');
});

// view proifle detail
router.get( '/:id', (req, res) => {
  const contact = contacts.find( c => c.id == req.params.id );

  if ( !contact ) {
    return res.status(404).send('Contact not found');
  }

  res.render('contact/contact_details', {
    title: 'Contact Details',
    content: 'View detailed information about this contact.', 
    contact
  });
});

// Handle Delete Contact
router.post('/delete/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = contacts.findIndex(item => item.id == id);
    if(index < 0) return res.status(404).send('Contact id not found');
    contacts.splice(index, 1);
    res.redirect('/contacts');
});


module.exports = router;
