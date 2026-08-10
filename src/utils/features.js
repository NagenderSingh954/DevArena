import { userSocketIDs } from "../app.js";

const emitEvent=(req,event,users,data)=>{
    console.log("emitting event ", event );
}


const getSockets=(users=[])=>{
    const sockets=users.map((u)=>userSocketIDs.get(u.id.toString()));
    return sockets;
}

export {emitEvent,getSockets}