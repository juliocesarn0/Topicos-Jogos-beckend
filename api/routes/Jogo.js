// API REST dos jogos
import express from "express";
import { connectToDatabase } from "../utils/mongodb.js";
import { check, validationResult } from "express-validator";

const router = express.Router();
const nomeCollection = "Jogos";
const { db, ObjectId } = await connectToDatabase();

/**********************************************
 * Validações
 *
 **********************************************/
const validaJogo = [
  check("codigo_Jogo")
    .not()
    .isEmpty()
    .trim()
    .withMessage("Tem que informar o código do jogo")
    .isNumeric()
    .withMessage(
      "O codigo do jogo não pode conter caracteres especiais, apenas números"
    )
    .isLength({ min: 1, max: 5 })
    .withMessage("O tamanho do codigo do jogo informado é inválido.")
    .custom((value, { req }) => {
      return db
        .collection(nomeCollection)
        .find({ cnpj: { $eq: value } })
        .toArray()
        .then((codigo_jogo) => {
          if (codigo_jogo.length && !req.body._id) {
            return Promise.reject(
              `O codigo do jogo ${value} já está informado em outro jogo`
            );
          }
        });
    }),
  check("nome_jogo")
    .not()
    .isEmpty()
    .trim()
    .withMessage("É obrigatório informar o nome do jogo")
    .isAlphanumeric("pt-BR", { ignore: "/. " })
    .withMessage("O nome do jogo deve conter apenas caracteres alfanuméricos")
    .isLength({ min: 3 })
    .withMessage("O nome do jogo é muito curto. Informe ao menos 3 caracteres")
    .isLength({ max: 100 })
    .withMessage(
      "O nome do jogo é muito longo. Informe no máximo até 100 caracteres"
    ),
  check("valor_jogo", "O valor do jogo só deve ser número").isNumeric(),
  check("descricao_jogo").optional({ nullable: true }),
];

/**********************************************
 * GET /api/jogos
 **********************************************/
router.get("/", async (req, res) => {
  /* 
     #swagger.tags = ['jogos']
     #swagger.description = 'Endpoint para obter todos os jogos de Serviço do sistema.' 
     */
  try {
    db.collection(nomeCollection)
      .find()
      .sort({ nome_jogo: 1 })
      .toArray((err, docs) => {
        if (!err) {
          /* 
          #swagger.responses[200] = { 
       schema: { "$ref": "#/definitions/Jogos" },
       description: "Listagem dos Jogos de serviço obtida com sucesso" } 
       */
          res.status(200).json(docs);
        }
      });
  } catch (err) {
    /* 
         #swagger.responses[500] = { 
      schema: { "$ref": "#/definitions/Erro" },
      description: "Erro ao obter a listagem dos Jogos" } 
      */
    res.status(500).json({
      errors: [
        {
          value: `${err.message}`,
          msg: "Erro ao obter a listagem dos jogos",
          param: "/",
        },
      ],
    });
  }
});

/**********************************************
 * GET /Jogos/id/:id
 **********************************************/
router.get("/id/:id", async (req, res) => {
  /* #swagger.tags = ['Jogos']
      #swagger.description = 'Endpoint que retorna os dados do jogo filtrando pelo id' 
      */
  try {
    db.collection(nomeCollection)
      .find({ _id: { $eq: ObjectId(req.params.id) } })
      .toArray((err, docs) => {
        if (err) {
          res.status(400).json(err); //bad request
        } else {
          res.status(200).json(docs); //retorna o documento
        }
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**********************************************
 * GET /jogos/nome_jogo/:nome_jogo
 **********************************************/
router.get("/nome_jogo/:nome_jogo", async (req, res) => {
  /* #swagger.tags = ['Jogos']
      #swagger.description = 'Endpoint que retorna os dados do jogo filtrando por parte da Razão Social' 
      */
  try {
    db.collection(nomeCollection)
      .find({ nome_jogo: { $regex: req.params.nome_jogo, $options: "i" } })
      .toArray((err, docs) => {
        if (err) {
          res.status(400).json(err); //bad request
        } else {
          res.status(200).json(docs); //retorna o documento
        }
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**********************************************
 * POST /jogo/
 **********************************************/
router.post("/", validaJogo, async (req, res) => {
  /* #swagger.tags = ['jogo']
      #swagger.description = 'Endpoint que inclui um novo jogo' 
      */
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
    });
  } else {
    await db
      .collection(nomeCollection)
      .insertOne(req.body)
      .then((result) => res.status(201).send(result)) //retorna o ID do documento inserido)
      .catch((err) => res.status(400).json(err));
  }
});

/**********************************************
 * PUT /jogos
 * Alterar um jogo pelo ID
 **********************************************/
router.put("/", validaJogo, async (req, res) => {
  let idDocumento = req.body._id;
  delete req.body._id; //removendo o ID do body para o update não apresentar o erro 66
  /* #swagger.tags = ['Jogos']
      #swagger.description = 'Endpoint que permite alterar os dados do jogo pelo id' 
      */
  const schemaErrors = validationResult(req);
  if (!schemaErrors.isEmpty()) {
    return res.status(403).json({
      errors: schemaErrors.array(), //retorna um Forbidden
    });
  } else {
    await db
      .collection(nomeCollection)
      .updateOne({ _id: { $eq: ObjectId(idDocumento) } }, { $set: req.body })
      .then((result) => res.status(202).send(result))
      .catch((err) => res.status(400).json(err));
  }
});

/**********************************************
 * DELETE /Jogos/
 **********************************************/
router.delete("/:id", async (req, res) => {
  /* #swagger.tags = ['jogos']
      #swagger.description = 'Endpoint que permite excluir um jogo filtrando pelo id' 
      */
  await db
    .collection(nomeCollection)
    .deleteOne({ _id: { $eq: ObjectId(req.params.id) } })
    .then((result) => res.status(202).send(result))
    .catch((err) => res.status(400).json(err));
});

export default router;
