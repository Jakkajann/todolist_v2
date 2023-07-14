//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", { useNewUrlParser: true })
.then(() => {
  console.log("Sucessfully connected to the database");
})
.catch( (err) => {
  console.log("Failed to connect to the database\n" + err);
});

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name Required"]
  }
});

const listSchema = {
  name: {
    type: String,
    required: [true, "Name Required"]
  },
  items: [itemSchema]
}; 

const Item = mongoose.model("Item", itemSchema);

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Item 1"
});

const item2 = new Item({
  name: "Item 2"
});

const item3 = new Item({
  name: "Item 3"
});

const defaultItems = [item1, item2, item3]

app.get("/", function(req, res) {

  Item.find({})
    .then((items) => {

      if (items.length === 0) {
        Item.insertMany(defaultItems)
        .then(() => {
          console.log("Default items inserted sucessfully");
        })
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: items});
      }

    });


});


app.get("/:customListName", (req, res) => {
  req.params.customListName = req.params.customListName.charAt(0).toUpperCase() + req.params.customListName.slice(1).toLowerCase();
  console.log(req.params.customListName);
  const customListName = req.params.customListName;
  List.findOne({name: customListName}).then((list) => {
    if(list) {
      res.render("list", {listTitle: list.name, newListItems: list.items});
    } else {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save().then(res.redirect(`/${customListName}`));
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName})
    .then((list) => {
      list.items.push(item);
      list.save().then(res.redirect(`/${listName}`));
    });
  }

});

app.post("/delete", (req, res) => {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({_id: checkedItemID})
    .then(() => {
      console.log("Item deleted sucessfully");
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}})
    .then(() => {
      res.redirect(`/${listName}`);
    });
  }


});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
