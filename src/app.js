import express from 'express'
import { prisma } from '../lib/prisma.js'


const app=express()

app.use(express.json())


app.post('/users',async (req,res) =>{
    try {
       const resp= await prisma.user.create({
            data:{
                email:req.body.email,
                name:req.body.name
            }
        })
        return res.status(200).json({
            message:"User Has been created successfully",
            user:resp
        })
    } catch (error) {
        console.log("There is error while creating the user ",error)
        return res.status(401).json({message:error.message})
    }
}).get(async (req,res)=>{
    const all=await prisma.user.findMany()
     return res.status(200).json({
            message:"User fetched successfully",
            user:all
        })
})
app.listen(3000,(error)=>{
    if(error){
        console.error(error)
        process.exit(1)
    }
    console.log("App is listing on the port 3000")
})
