var express = require('express');
const bodyParser = require('body-parser');
const { emit } = require('process');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

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
    io.emit('mensaje', req.body)//TODO: ADEMAS DE CIFRAR, MIRAR QUE TIENE EL req.body
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