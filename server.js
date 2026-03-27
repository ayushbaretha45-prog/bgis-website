const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const teams = require("./teams");

// Hardcoded admin users
const users = [
  { username: "ayush", password: "ayush@123" },
  { username: "aditya", password: "aditya@123" }
];

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: "bgisSecretKey", 
    resave: false,
    saveUninitialized: false
}));

// Middleware to protect admin
function checkAuth(req, res, next){
    if(req.session.user){
        next();
    } else {
        res.redirect("/login");
    }
}

// Login Page
app.get("/login", (req, res)=>{
    res.render("login", { error: null });
});

// Login POST
app.post("/login", (req, res)=>{
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if(user){
        req.session.user = user.username;
        res.redirect("/admin");
    } else {
        res.render("login", { error: "Invalid username or password" });
    }
});

// Logout
app.get("/logout", (req,res)=>{
    req.session.destroy();
    res.redirect("/login");
});

// Main dashboard
app.get("/", (req, res) => {
    teams.forEach(team => team.points = team.kills + team.placement);
    teams.sort((a,b)=> b.points - a.points);
    res.render("index", { teams });
});

// Admin page (protected)
app.get("/admin", checkAuth, (req, res) => {
    res.render("admin", { teams, user: req.session.user });
});

// Update team kills/placement
app.post("/update", checkAuth, (req, res) => {
    const { team, kills, placement } = req.body;
    const selected = teams.find(t => t.name === team);
    if (selected) {
        selected.kills = parseInt(kills);
        selected.placement = parseInt(placement);
        selected.points = selected.kills + selected.placement;
    }
    teams.sort((a,b)=> b.points - a.points);
    io.emit("updateTable", teams);
    res.redirect("/admin");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));