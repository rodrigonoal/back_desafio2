const fs = require("fs").promises;
const moment = require("moment")
const instanciaAxios = require("../services/pagarme")
const { atualizarCarrinho } = require("./carrinho")

const registrarVendas = async (boleto_url, id, carrinho, user) => {
    let vendas = JSON.parse(await fs.readFile("./relatorios/vendas.json"));
    const novaVenda = {
        "id": id,
        "usuario": user,
        "dataVenda": moment(),
        "linkDoBoleto":boleto_url,
        "valorDaVenda": carrinho.totalAPagar,
        "produtos": carrinho.produtos,
    };

    vendas.push(novaVenda)

    await fs.writeFile("./relatorios/vendas.json", JSON.stringify(vendas))

    console.log("Venda registrada!")
}


const finalizarCompra = async (req, res) => {
    //Verificações:
    const { user } = req.query;
    const carrinho = JSON.parse(await fs.readFile(`./carrinhos/${user}.json`));
    const { type, country, name, documents } = req.body;
    let nomeVerificado = name.split(" ").filter(nome => nome.toUpperCase() !== nome.toLowerCase());
    const cpf = documents.find(document => document.type === "cpf");
    if (!cpf) {
        res.json("Erro! Não foi informado CPF no cadastro.");
        return;
    };
    let numeroVerificado = cpf.number.split('').map(n => Number(n + 1)).filter(n => n);

    if (!(nomeVerificado.length >= 2)) {
        res.json("Erro! Você deve incluir nome e sobrenome no cadastro.");
        return;
    };
    if (!(country.length === 2)) {
        res.json("Erro! O país informado deve possuir dois caracteres.");
        return;
    };
    if (!(type === "individual")) {
        res.json("Erro! O cadastro deve ser feito por pessoa física.");
        return;
    };
    if (!(numeroVerificado.length === 11)) {
        res.json("Erro! O CPF informado não possui onze caracteres.");
        return;
    };
    if (carrinho.subtotal === 0) {
        res.json("Erro! O carrinho está vazio!");
        return;
    }


    //Conferência do estoque + exclusão
    const arrayEstoque = JSON.parse(await fs.readFile("./estoque/produtos.json")).produtos;

    let estoqueConferido = [];
    let estoqueFalho = [];
    carrinho.produtos.forEach(compra => {
        produtoAlterado = arrayEstoque.find(p => compra.id === p.id)
        produtoAlterado.estoque -= compra.quantidade

        if (produtoAlterado.estoque < 0) {
            estoqueFalho.push(produtoAlterado.nome)
            return;
        }
        estoqueConferido.push(produtoAlterado)
    });

    if (estoqueFalho.length) {
        res.json(`Falha na finalização. Os seguintes produtos não possuem estoque suficiente para cumprimento do pedido: ${estoqueFalho.join(', ')}`)
        return;
    }

    try {
        const pedido = await instanciaAxios.post('transactions', {
            "amount": carrinho.totalAPagar,
            "payment_method": "boleto",
            "boleto_expiration_date": moment().businessAdd(3).format('yyyy-MM-D'),
            "customer": {
                "external_id": user,
                "name": name,
                "type": type,
                "country": country,
                "documents": documents,
            }
        });

        const { boleto_url, id, boleto_barcode, boleto_expiration_date } = pedido.data

        registrarVendas(boleto_url, id, carrinho, user)

        carrinho.produtos = []
        atualizarCarrinho(carrinho)
        await fs.writeFile(`./estoque/produtos.json`, JSON.stringify({'produtos': arrayEstoque}))
        await fs.writeFile(`./carrinhos/${user}.json`, JSON.stringify(carrinho));

        res.json({
            "mensagem": 'Compra finalizada com sucesso!',
            "códigoDeAcompanhamento": id,
            "linkDoBoleto": boleto_url,
            "codigoDeBarras": boleto_barcode,
            "dataDeVencimento": boleto_expiration_date
        });

    } catch (error) {
        res.json(`Erro na transação. Tente novamente mais tarde.`)
        return;
    }
}



module.exports = { finalizarCompra };