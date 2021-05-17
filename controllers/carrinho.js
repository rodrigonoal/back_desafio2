const fs = require("fs").promises;
const moment = require("moment");
const momentBusinessDays = require("moment-business-days");



const atualizarCarrinho = (cart) => {
    cart.subtotal = 0;
    cart.produtos.forEach(produto => cart.subtotal += produto.preco * produto.quantidade);
    cart.dataDeEntrega = (cart.subtotal === 0 ? null : moment().businessAdd(15));
    cart.valorDoFrete = (cart.subtotal === 0 || cart.subtotal > 20000 ? 0 : 5000);
    if(cart.cupomDeDesconto){
        if(cart.cupomDeDesconto === "PRIMEIRACOMPRA"){
            cart.subtotal *= 0.9; 
        }
        else if(cart.cupomDeDesconto === "TRIOPARADADURA"){
            cart.produtos.sort((a, b) => a.preco - b.preco);
            let terceiroGratis = cart.produtos.find(produto => produto.quantidade >= 3);
            terceiroGratis ? cart.subtotal -= terceiroGratis.preco : cart.cupomDeDesconto = false;
        }
        else if(cart.cupomDeDesconto === "PIPOCA&NETFLIX"){
            let pipocaYoki = cart.produtos.find(produto => produto.nome === "Pipoca para Microondas Manteiga YOKI 50g");
            pipocaYoki ? cart.subtotal -= (pipocaYoki.preco*pipocaYoki.quantidade*0.5) : cart.cupomDeDesconto = false;
        }
    }
    cart.produtos.sort((a, b) => a.id - b.id);
    cart.totalAPagar = cart.valorDoFrete + cart.subtotal;
}


const abrirCarrinho = async (req, res) => {
    const { user } = req.query;
    const carrinho = JSON.parse(await fs.readFile(`./carrinhos/${user}.json`));
    atualizarCarrinho(carrinho)
    res.json(carrinho)
}


const adicionarProduto = async (req, res) => {
    const { id, quantidade } = req.body;
    const arrayEstoque = JSON.parse(await fs.readFile("./estoque/produtos.json")).produtos;

    const { user } = req.query;
    const carrinho = JSON.parse(await fs.readFile(`./carrinhos/${user}.json`));

    const existeProduto = carrinho.produtos.find(produto => produto.id === id);

    if(existeProduto) {
        res.json("Erro! Este produto já está no carrinho. Utilize o canal apropriado para editar sua quantidade.")
        return;
    }

    const compra = arrayEstoque.find(produto => (produto.id === id) && (produto.estoque >= quantidade));

    if (!compra) {
        res.json('Erro! Não temos estoque suficiente do produto escolhido ou ele não existe.')
        return;
    }

    compra.quantidade = quantidade;
    delete compra.estoque;

    carrinho.produtos.push(compra);

    atualizarCarrinho(carrinho);
    await fs.writeFile(`./carrinhos/${user}.json`, JSON.stringify(carrinho));

    res.json(carrinho);
}


const editarCompra = async (req, res) => {
    const idCompra = Number(req.params.idProduto);
    const { quantidade } = req.body;

    const arrayEstoque = JSON.parse(await fs.readFile("./estoque/produtos.json")).produtos;
    const emEstoque = arrayEstoque.find(produto => produto.id === idCompra)

    const { user } = req.query;
    const carrinho = JSON.parse(await fs.readFile(`./carrinhos/${user}.json`));

    const produtoEditado = carrinho.produtos.find(produto => produto.id === idCompra);
    const novosProdutos = carrinho.produtos.filter(produto => produto.id !== idCompra);

    if (!produtoEditado) {
        res.json('Erro! Não existe o produto com este ID no carrinho.');
        return;
    };

    produtoEditado.quantidade += quantidade;

    if (produtoEditado.quantidade > emEstoque.estoque) {
        res.json('Erro! Não há estoque suficiente para cumprimento da requisição.');
        return;
    };
    if (produtoEditado.quantidade < 0) {
        res.json('Erro! Não é possível excluir mais elementos que estão no carrinho.');
        return;
    };
    if (produtoEditado.quantidade > 0) {
        novosProdutos.push(produtoEditado);
    };
    carrinho.produtos = novosProdutos

    atualizarCarrinho(carrinho);
    await fs.writeFile(`./carrinhos/${user}.json`, JSON.stringify(carrinho));

    res.json(carrinho);
}


const apagarProduto = async (req, res) => {
    const idCompra = Number(req.params.idProduto);

    const { user } = req.query;
    const carrinho = JSON.parse(await fs.readFile(`./carrinhos/${user}.json`));

    const produtoApagado = carrinho.produtos.find(produto => produto.id === idCompra);
    const novosProdutos = carrinho.produtos.filter(produto => produto.id !== idCompra);

    if (!produtoApagado) {
        res.json("Erro! Não é possível excluir produto inexistente.");
        return;
    }

    carrinho.produtos = novosProdutos

    atualizarCarrinho(carrinho);
    await fs.writeFile(`./carrinhos/${user}.json`, JSON.stringify(carrinho));

    res.json(carrinho);
}


const apagarCarrinho = async (req, res) => {
    const { user } = req.query;
    const carrinho = JSON.parse(await fs.readFile(`./carrinhos/${user}.json`));

    carrinho.produtos = [];

    atualizarCarrinho(carrinho);
    await fs.writeFile(`./carrinhos/${user}.json`, JSON.stringify(carrinho));

    res.json("Carrinho limpo!");
}


module.exports = {
    abrirCarrinho,
    adicionarProduto,
    atualizarCarrinho,
    editarCompra,
    apagarProduto,
    apagarCarrinho,
};

