
//importing the packages
const { createServer } = require("http");
const { Server } = require("socket.io");
const { instrument } = require('@socket.io/admin-ui');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const fs = require('fs')
require('dotenv').config();



//importing the modules 
const sequelize = require('./util/database');
const User = require('./models/users');
const Forgotpasswords = require('./models/forgot-password');
const ChatHistory = require('./models/chat-history');
const Groups = require("./models/groups");
const GroupMember = require('./models/group-members');



//importing the services 
const websocketService = require('./services/websocket');
const cronService = require('./services/cron');


//initializing the cronJob which is defined in cron file
cronService.job.start();



//importing the routes
const mainRoute = require('./routes/home');
const userRoute = require('./routes/user');



const accessLogStream = fs.createWriteStream('./access.log', { flags: 'a' });



//instantiating the application and initializing the morgan for access log and defining the cors and json format data and urlencoded data and parsing cookie
const app = express();
app.use(morgan('combined', { stream: accessLogStream }));
app.use(cors({
  origin: '*',
  methods:['GET','POST'],

}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(cookieParser());



//defining the route definition
app.use('/user',userRoute)
app.use(mainRoute)



//initiating the http server and after that websocket connection is established (for upgrading to websocket protocol for bidirectional communication)
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io",],
    credentials: true
  }
});
io.on('connection', websocketService )




//for performancet monitoring on socket-io-admin
instrument(io, { auth: false })



// defining relationship between the models 
User.hasMany(Forgotpasswords);
Forgotpasswords.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
User.hasMany(ChatHistory);
ChatHistory.belongsTo(User, { constraints: true });
User.belongsToMany(Groups, { through: GroupMember });
Groups.belongsToMany(User, { through: GroupMember });
Groups.belongsTo(User, {
  foreignKey: "AdminId",
  constraints: true,
  onDelete: "CASCADE",
});
Groups.hasMany(ChatHistory);
ChatHistory.belongsTo(Groups);



//defining the port for the server and initiating the server and syncing the database
const PORT = process.env.PORT || 3000;
async function initiate() {
    try {
      
      const res = await sequelize.sync();                                                           //await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
                                                                                                                 // Remove foreign key constraints
      httpServer.listen(PORT, () => {                                                                           //await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");                                                                            
        console.log(`Server is running on port ${PORT} `);                                                      //drop tables
      });                                                                                                       // Restore foreign key constraints
    } catch (err) {                                                                                             // Restore foreign key constraints
      console.error("Error during server initialization:", err);                                                //
      process.exit(1);
    }                                                                                         
  }
  initiate();