//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const app = express();
const _=require("lodash");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Setup webserver
let port= process.env.PORT;
if (port==null||port=="") {
  port=3000;
}
app.listen(port, function() {
  console.log("Server started on port "+port);
});
// app.listen(3000, function() {
//   console.log("Server started on port 3000");
// });

//connection string to mongodb
// mongoose.connect("mongodb://localhost:27017/todolistdb",{useNewUrlParser:true, useUnifiedTopology: true, useFindAndModify:false});
mongoose.connect("mongodb+srv://rrow10:Mongodb234@cluster0-ublo5.mongodb.net/todolistdb",{useNewUrlParser:true, useUnifiedTopology: true, useFindAndModify:false});
//schema
const itemsSchema={name:String};
//model
const itemModel= mongoose.model("item",itemsSchema);

//input
const item1 = new itemModel({name:"welcome to to do list"});
const item2 = new itemModel({name:"hit + to add new item"});
const item3 = new itemModel({name:"<-- click here to delete"});
const defaultItems=[item1,item2,item3];

//list schema
const listSchema={
  name:String,
  items:[itemsSchema]
};

//create model of List
const ListModel=mongoose.model("List",listSchema);

app.get("/", function(req, res) {
  itemModel.find({},function(err, foundItems){
    if (foundItems.length===0) {
      itemModel.insertMany(defaultItems,function(err){
        if (err) { console.log(err);
        }else {
          console.log("Insert OK");
        }
      });
      res.redirect("/");
    }else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName= req.body.list;

  const item=new itemModel({
    name:itemName
  });

  if (listName==="Today") {
    item.save();
    res.redirect("/");
  }else {
    ListModel.findOne({name:listName},function(err,foundList){
      if (!err) {
        console.log("list name : "+ foundList.name);
        foundList.items.push(item);
        foundList.save();
        console.log("saved item : "+item);
        console.log("Updated data : "+foundList);
        res.redirect("/"+listName);
      }
    })
  }
});

//dynamic route create new list
app.get("/:customListName", function(req,res){
  const customListName=_.capitalize(req.params.customListName);

  ListModel.findOne({name:customListName},function(err,foundList){
    if (!err) {
      if (!foundList) {
        //create new list
        const list=new ListModel({
          name:customListName,
          items:defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }else {
        //show an existing List
        res.render("list",{listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

//Delete items
app.post("/delete",function(req,res){
  const checkeditemid=req.body.checkbox;
  const listName= req.body.listName;

  if (listName==="Today") {
    itemModel.deleteOne({"_id":checkeditemid},function(err){
      if (!err) {
        res.redirect("/");
        console.log("item "+checkeditemid+" on "+listName+" deleted")}
    });
  }else {
    ListModel.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkeditemid}}},function(err,foundList){
      if (!err) {
        res.redirect("/"+listName);
      }
    });
  }

});

app.get("/about", function(req, res){
  res.render("about");
});
