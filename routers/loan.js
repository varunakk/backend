const express=require("express");
const { default: mongoose } = require("mongoose");
const multer = require("multer");   
const uuidv4 = require('uuid/v4');
const router=express.Router();


const loancoll=require("../models/loan");
const { json } = require("body-parser");
const DIR="./public/";
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, DIR);
    },
    filename: (req, file, cb) => {
        const fileName = file.originalname.toLowerCase().split(' ').join('-');
        cb(null, uuidv4() + '-' + fileName)
    }
});
var upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    }
});


router.get("/",async(req,res)=>{
    const redisClient=await require("../models/redis").getConnection();

    var tutorialName = "allLoanList";
    console.log(tutorialName);
    //console.log(await redisClient.EXISTS("allLoanList"))
    d=await redisClient.get(tutorialName) //redisClient.EXISTS(tutorialName)
    if(d){
        data = await redisClient.get(tutorialName)
        console.log("Getting data from Redis Cache");
        console.log(data);
        if(data.length!=0){
            res.json(JSON.parse(data));
        }
        else{
            lon = await loancoll.find()   // ({ $or: [ { id : req.params.acc }, {acc: req.params.acc  } ] } )
            console.log("loan",lon);
               console.log(JSON.stringify(lon));
               dal = await  redisClient.setEx(tutorialName,600,JSON.stringify(lon));
               res.json(lon);   
   
        }
        
    }
    else{
    const response=await loancoll.find();
    console.log(response);
  dal = await  redisClient.setEx(tutorialName,600, JSON.stringify(response));

    res.json(response);
    }

});



router.get("/:acc",async(req,res)=>{
    try{
        lon = await loancoll.find( {acc: req.params.acc  })   // ({ $or: [ { id : req.params.acc }, {acc: req.params.acc  } ] } )
            res.json(lon);   
    }
    catch{

    console.log("err") 
    }
});

router.get("/:acc/:id",async(req,res)=>{
    try{
        console.log( req.params.acc);
        lon = await loancoll.findById( req.params.id)   // ({ $or: [ { id : req.params.acc }, {acc: req.params.acc  } ] } )
        res.json(lon);
    }
    catch(err){
        console.log("err",err.message);
    }
});

router.post("/",upload.single('profileImg'),async(req,res)=>{
   // console.log(req.body)
   const redisClient=await require("../models/redis").getConnection();

   const url = req.protocol + '://' + req.get('host');
    const u=new loancoll({
        acc:req.body.acc,
        loan_amount:req.body.loan_amount,
        no_of_months:req.body.no_of_months,
        interest:req.body.interest,
        amount_to_be_payed:req.body.amount_to_be_payed,
        profileImg: url+'/public/'+req.file.filename
    })
    try{
        const response=await u.save();

        var tutorialName = "allLoanList";

        d=await redisClient.get(tutorialName)
        if(d){
            try{

            dal = await  redisClient.rPush(tutorialName, JSON.stringify(u));
        }
        catch{
            console.log("err in loan red pus")
        }
        }
        else{
            try{

            dal = await  redisClient.setEx(tutorialName,600, JSON.stringify(u));
        }
        catch{
            console.log("err in loan red pus")
        }
        }

        res.json(response);
        
    }catch(err){
    res.send(err);
    }
    });




//update individual
router.patch("/:id", getloan, async (req, res) =>{
    console.log("req.body.amount_to_be_payed"+req.body.amount_to_be_payed);
    if(req.body.amount_to_be_payed != null){
        res.lon.amount_to_be_payed = req.body.amount_to_be_payed
        res.lon.markModified('amount_to_be_payed');
        res.lon.profileImg=res.lon.profileImg
        res.lon.markModified('profileImg');

    }

    console.log("patch ",res.lon);
    try {
       
        const updatedStudent = await res.lon.save()
        res.status(200).json(updatedStudent)
    } catch (error) {
        res.status(500).json({message: error.message})
    }
})

async function getloan(req,res,nxt) {
    let student
    try {
        student = await loancoll.findById(req.params.id)
        if(student == null){
            return res.status(400).json({message: "user does not exist"})
        }
    } catch (error) {
        res.status(500).json({message: error.message})
    }
    res.lon= student
    nxt()
}




//delete individual
router.delete("/:id",async (req, res) =>{
    try {

         loancoll.findByIdAndRemove(req.params.id, function (err, doc) {
            if (err) console.log(err);
            res.status(200).json({message: "deleted succesfully"})

            });
            
       // res.status(200).json({message: "deleted succesfully"})
    } catch (error) {
        res.status(500).json({message: error.message})
    }
})



module.exports=router