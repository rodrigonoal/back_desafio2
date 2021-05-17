const fs = require("fs").promises;



const relatorioVendas = async (req,res) => {
    const vendasArray = JSON.parse(await fs.readFile("./relatorios/vendas.json"));

    let unidadesVendidas = 0;
    let valorAcumulado = 0;
    vendasArray.forEach(venda => {
        venda.produtos.forEach(produto => {
            if(produto.id === 10){
                valorAcumulado += produto.quantidade*produto.preco
                unidadesVendidas += produto.quantidade
            };
        });
    });

    res.json(`${valorAcumulado} em ${unidadesVendidas}`)
}

module.exports = { relatorioVendas }