const fs = require("fs").promises;


const listarProdutos = async (req, res) => {
const { categoria, precoInicial, precoFinal } = req.query
let arrayEstoque = JSON.parse(await fs.readFile("./estoque/produtos.json")).produtos

arrayEstoque = arrayEstoque.filter(produto => produto.estoque > 0)

if (categoria){
arrayEstoque = arrayEstoque.filter(produto => produto.categoria.toUpperCase() === categoria.toUpperCase())
}
if (precoInicial && precoFinal){
arrayEstoque = arrayEstoque.filter(produto => produto.preco >= Number(precoInicial) && produto.preco <= Number(precoFinal))
}


res.send(arrayEstoque)
}

module.exports = { listarProdutos };