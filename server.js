var express = require('express');
const bodyParser = require('body-parser');
const { emit } = require('process');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const NodeRSA = require('node-rsa');
const key = new NodeRSA({b: 512});

function decrypts (data) {
    return new NodeRSA(key.exportKey('private')).decrypt(data, 'utf8');
}
//servir contenido estatico
app.use(express.static(__dirname))

//body parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))

var mensajes = [
    {
        nombre: "admin",
        mensaje: "Bienvenidos a todos!."
    }
]
var usuarios = [
        {
            nombre: "admin"
        }
]

//endpoints/uris/recursos
app.get('/mensajes', (req, res)=>{
    res.send(mensajes)
});
app.get('/usuarios', (req, res)=>{
    res.send(usuarios)
});

app.post('/mensajes', (req, res)=>{
    mensajes.push(req.body)
    //emitir evento 'mensaje'
    const msgDcrypt = new NodeRSA(key.exportKey('public')).encrypt(req.body.mensaje, 'base64')
    const newReq = {
        nombre: req.body.nombre,
        mensaje: msgDcrypt,
        decrypts: decrypts(msgDcrypt)
    }
    io.emit('mensaje', newReq) //TODO: Cifrado, ahora mirar como podemos pasar la llave privada
    res.sendStatus(200)
})
//Escuchar/emitir eventos con socket.io
io.on('connection', (socket)=>{
    var newUser = ""
    socket.on('nuevouser', function(nick){
        newUser = nick+"_"+usuarios.length

        usuarios.push({id:socket.id, nombre: newUser})

        console.log("Usuario conectado: "+newUser+" ID: "+socket.id)
        //avisar a los cliente que un nuevo usuario se conecto.
        io.emit("clienteconectado", usuarios)
        
    })
    //TODO: DESCIFRAR
    socket.on('enviarmsgprivado', function(data){
        //console.log(data)
        //emitir evento 'recibirmensaje' para un usuario
        io.to(data.destinatarioID).emit('recibirmensajeprivado', data)
    });

    socket.on('disconnect', ()=>{
        eliminarUsuario(newUser);
        io.emit('usuariodesconectado', 'desconectado: '+newUser)

    })

})
function eliminarUsuario(val){
    for(var i=0; i<usuarios.length; i++){
        if(usuarios[i].nombre == val){
            usuarios.splice(i, 1)
            break;
        }
    }
}


var server = http.listen(3000, ()=>{
    console.log("servidor corriendo en puerto:",
    server.address().port);
})