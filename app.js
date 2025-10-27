// var ambiente_processo = 'producao';
var ambiente_processo = 'desenvolvimento';

var caminho_env = ambiente_processo === 'producao' ? '.env' : '.env.dev';
// Acima, temos o uso do operador ternário para definir o caminho do arquivo .env
// A sintaxe do operador ternário é: condição ? valor_se_verdadeiro : valor_se_falso

require("dotenv").config({ path: caminho_env });


var express = require("express");
var cors = require("cors");
var path = require("path");


var indexRouter = require("./src/routes/index");
var loginRouter = require("./src/routes/login");
var cadastroRouter = require("./src/routes/cadastro");
var app = express();
var PORTA_APP = process.env.APP_PORT;
var HOST_APP = process.env.APP_HOST;

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use('/src', express.static(path.join(__dirname, 'src')));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/login", loginRouter);
app.use("/cadastro", cadastroRouter);
app.use("/", indexRouter);


app.listen(PORTA_APP, function(){
    console.log(`http://${HOST_APP}:${PORTA_APP}`)
});
