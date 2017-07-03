const customerView = function() {
    let t = new Table;
    connection.query('SELECT ?? FROM products', [
        ['item_id', 'product_name', 'price', 'stock_quantity', 'sold', 'product_sales']
    ], function(error, results, fields) {
        results.forEach(function(product) {
            t.cell('Item id', product.item_id);
            t.cell("Product Name", product.product_name);
            t.cell("Price, USD", product.price, Table.number(2));
            t.cell("Stock left", product.stock_quantity)
            t.newRow();
        })
        console.log(t.toString());
        chooseProduct(results);
    })
}

const chooseProduct = function(products) {
    inq.prompt([{
        type: 'input',
        message: 'Enter product id of the item you want to buy',
        name: 'id'
    }, {
        type: 'input',
        message: 'How many do you want to buy?',
        name: 'qty'
    }]).then(function(item) {
        let exists = false;
        let pickedProduct = {};
        products.forEach(function(val) {
            if (val.item_id === parseInt(item.id)) {
                exists = true;
                pickedProduct = val;
            }
        })
        const totalLeft = pickedProduct.stock_quantity - parseInt(item.qty)
        if (exists && totalLeft >= 0) {
            buyProduct(parseInt(item.qty), pickedProduct);
        } else {
            console.log(totalLeft ? "There arnt enought enough in stock to buy that many" : "That Item ID doesnt seem to exist try agian")
            chooseProduct(products);
        }
    })
}

const buyProduct = function(qty, product) {
    let cost = product.price * qty
    let values = [product.stock_quantity - (1 * qty), product.sold + (1 * qty), product.product_sales + (product.price * qty), product.item_id]
    connection.query('UPDATE products SET stock_quantity = ?, sold = ?, product_sales = ? WHERE item_id = ?', values, function(error, results, fields) {
        if (!error) {
            console.log(`Total Cost : $${cost}.00`)
        } else {
            console.log(error)
        }
    })
}

module.exports = {
    customerView
}
