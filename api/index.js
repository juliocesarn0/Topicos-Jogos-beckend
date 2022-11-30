import express from "express";
import cors from "cors";
//import fs from 'fs'
//import swaggerUI from 'swagger-ui-express'
//import das rotas do app
import rotasJogos from "./routes/Jogo.js";

const app = express();
const port = process.env.PORT || 3900;

app.use(cors());
app.use(express.urlencoded({ extended: true })); //Analisa as requisições vindas via urlencoded payloads .
app.use(express.json()); // Irá fazer o parse de arquivos JSON
//Configura o favicon
app.use("/favicon.ico", express.static("public/fatecitu.jpg"));
//Rotas de conteúdo público
app.use("/", express.static("public"));
// Rotas do app
app.use("/api/jogos", rotasJogos);

app.get("/api", (req, res) => {
  res.status(200).json({
    message: "API Topicos Jogos Mobile 100% funcional🖐",
    version: "1.0.0",
  });
});
//Rota da Documentação do Projeto
//app.use('/doc', swaggerUI.serve, swaggerUI.setup(JSON.parse(fs.readFileSync('./api/swagger/swagger_output.json'))))

//Rota para tratar erros - deve ser sempre a última!
app.use(function (req, res) {
  res.status(404).json({
    errors: [
      {
        value: `${req.originalUrl}`,
        msg: `A rota ${req.originalUrl} não existe nesta API!`,
        param: "invalid route",
      },
    ],
  });
});
app.listen(port, function () {
  console.log(`Servidor rodando na porta ${port}!🚀`);
});
