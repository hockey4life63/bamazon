const inq = require('inquirer');
const mysql = require('promise-mysql');
const Table = require('easy-table');
const key = require('./keys');

let connection;

mysql.createConnection(key.key).then(function(conn) {
    connection = conn;
    mainPage();
});


const mainPage = function() {
    inq.prompt([{
        type: 'list',
        name: 'page',
        choices: ['Customer', 'Manager', 'Admin', "Exit"],
        message: "What page would you like to see?"
    }]).then(function(choice) {
        if (choice.page === "Customer") {
            customerView();
        } else if (choice.page === "Manager") {
            managerView();
        } else if (choice.page === "Admin") {
            adminView();
        } else {
            connection.end();
        }
    });

}

const adminView = function() {
    inq.prompt([{
            type: "list",
            message: "What do you wanna do?",
            choices: ["Check Department Sales", "Add New Department"],
            name: "choice"

        }

    ]).then(function(option) {
        if (option.choice.includes("Check")) {
            console.log("check sales")
            checkSales();
        } else {
            addDepartment();
        }
    })
}

const checkSales = function() {
    connection.query("SELECT d.overhead_cost, d.department_name, sum(p.product_sales) as total_sales" +
        " FROM  departments d" +
        " LEFT join products p on d.department_name = p.department_name" +
        " group by d.department_name",
        function(err, results, fields) {
            let t = new Table;
            results.forEach(function(department) {
                t.cell('Department Name', department.department_name);
                t.cell("Overhead Costs", department.overhead_cost);
                t.cell("Total_sales", department.total_sales ? department.total_sales : 0);
                t.newRow();
            })
            console.log(t.toString());
            mainPage();
        })
}

const addDepartment = function() {
    inq.prompt([{
        type: "input",
        message: "What is the department name:",
        name: "name"
    }, {
        type: "input",
        message: "Enter overhead costs:",
        name: "cost",
        validate: function(input) {
            return !isNaN(parseInt(input))
        }
    }]).then(function(res) {
        connection.query("INSERT INTO departments (department_name, overhead_cost) VALUES (?,?)", [res.name, res.cost], function(err, results, fields) {
            if (err) throw err;
            console.log("Success")
            mainPage();
        })
    })
}

const managerView = function() {
    inq.prompt([{
        type: 'list',
        name: 'page',
        choices: ['View Products for Sale', 'View Low Inventory', 'Add to Inventory', 'Add New Product'],
        message: "What page would you like to see?"
    }]).then(function(choice) {
        if (choice.page.includes("for Sale")) {
            customerView(true);
        } else if (choice.page.includes('Low')) {
            lowInventory();
        } else if (choice.page.includes('Add to')) {
            addItem();
        } else if (choice.page.includes('Add New')) {
            newItem();
        }
    });
}

const newItem = function() {
    inq.prompt([{
        type: 'input',
        message: "Enter Product Name:",
        filter: function(name) {
            return name.toLowerCase();
        },
        name: 'name'
    }, {
        type: 'list',
        message: "Which Department?",
        choices: ['Electonics', 'Home Goods'],
        filter: function(department) {
            return department.toLowerCase();
        },
        name: 'department'
    }, {
        type: 'input',
        message: 'Enter the unit price in USD:',
        name: 'price',
        validate: function(price) {
            return parseInt(price) !== NaN ? true : false;
        }
    }, {
        type: 'input',
        message: 'Enter amount of stock:',
        name: 'qty',
        validate: function(price) {
            return parseInt(price) !== NaN ? true : false;
        }
    }]).then(function(product) {
        let name = product.name;
        let department = product.department;
        let price = product.price;
        let qty = product.qty;
        connection.query('INSERT INTO products (product_name, price, stock_quantity, department_name) VALUES (?,?,?,?)', [name, price, qty, department], function(error, results, fields) {
            if (error) {
                console.log(error)
            } else {
                console.log(`Added ${qty} ${name}s to database for department ${department} at $${price}`);
                mainPage();
            }
        })
    })
}

const lowInventory = function() {
    connection.query('SELECT * FROM products WHERE stock_quantity <= 5', function(error, results, fields) {
        let t = new Table;
        results.forEach(function(product) {
            t.cell('Item id', product.item_id);
            t.cell("Product Name", product.product_name);
            t.cell("Price, USD", product.price, Table.number(2));
            t.cell("Stock left", product.stock_quantity)
            t.cell("Sold", product.sold);
            t.cell("Product Total Sales", product.product_sales);
            t.newRow();
        })
        console.log(t.toString());
        mainPage();
    });
}

const addItem = function(isNew) {
    inq.prompt([{
        type: "input",
        message: "Enter Item number You Want to add",
        name: "ID"
    }]).then(function(item) {
        confirmItem(item.ID)
    })
}

const confirmItem = function(id) {
    connection.query('SELECT product_name FROM products WHERE item_id = ?', [id], function(error, results, fields) {
        console.log(id)
        if (error || results.length === 0) {
            console.log('Invaild ID try another agian')
            addItem();
        } else {
            inq.prompt([{
                type: "confirm",
                message: `Is ${results[0].product_name} The correct item?`,
                name: 'correct'

            }]).then(function(ans) {

                if (ans.correct === false) {
                    addItem();
                } else {
                    addToInventory(id);
                }
            })
        }
    })
}

const addToInventory = function(id) {
    inq.prompt([{
        type: 'input',
        message: 'How many do you want to add?',
        name: 'qty'
    }]).then(function(item) {
        let qty = parseInt(item.qty)
        if (qty > 0) {
            connection.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE item_id = ?', [qty, id], function(error, results, fields) {
                if (error) {
                    console.log(error)
                    addToInventory(id);
                } else {
                    console.log('Success!');
                    mainPage();
                }
            })
        } else if (qty === NaN) {
            console.log('You must only enter numbers')
            addToInventory(id);
        }
    })
}


const customerView = function(manager) {
    let t = new Table;
    connection.query('SELECT * FROM products', function(error, results, fields) {
        results.forEach(function(product) {
            t.cell('Item id', product.item_id);
            t.cell("Product Name", product.product_name);
            t.cell("Price, USD", product.price, Table.number(2));
            t.cell("Stock left", product.stock_quantity)
            if (manager) {
                t.cell("Sold", product.sold);
                t.cell("Product Total Sales", product.product_sales);
            }
            t.newRow();
        })
        console.log(t.toString());
        !manager ? chooseProduct(results) : mainPage();
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
        const totalLeft = pickedProduct.stock_quantity - parseInt(item.qty);
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
            console.log(`Total Cost : $${cost}.`)
            mainPage();
        } else {
            console.log(error)
        }
    })
}
