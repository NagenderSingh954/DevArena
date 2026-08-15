import { app, userSocketIDs } from "../app.js";

const emitEvent=(req,event,users,data)=>{
   

    const io=req.app.get("io");
    const memebers=getSockets(users);

    io.to(memebers).emit(event,data)

}


const getSockets=(users=[])=>{
    const sockets=users.map((u)=>userSocketIDs.get(u.toString()));
    return sockets;
}

export {emitEvent,getSockets}