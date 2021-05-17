const express = require("express");
const estoque = require("./controllers/estoque")
const carrinho = require("./controllers/carrinho")
const finalizador = require("./controllers/finalizador")
const relatorio = require("./controllers/relatorio")

const routes  = express();

routes.get("/produtos", estoque.listarProdutos);
routes.get("/carrinho", carrinho.abrirCarrinho);
routes.post("/carrinho/produtos", carrinho.adicionarProduto);
routes.patch("/carrinho/produtos/:idProduto", carrinho.editarCompra);
routes.delete("/carrinho/produtos/:idProduto", carrinho.apagarProduto);
routes.delete("/carrinho", carrinho.apagarCarrinho);
routes.post("/finalizar-compra", finalizador.finalizarCompra);

routes.get("/relatorio", relatorio.relatorioVendas)




module.exports = routes;
