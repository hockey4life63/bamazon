create database bamazon;

use bamazon;

CREATE TABLE products(
	item_id integer(11) auto_increment,
    product_name varchar(30) not null,
    department_name varchar(10) not null,
    price integer(11) not null,
    stock_quantity integer(10) default 0,
    primary key(item_id)
);

CREATE TABLE departments(
	department_id integer(11) auto_increment,
    department_name varchar(30) not null,
    overhead_cost integer(11) default 10000,
    primary key (department_id)
);

ALTER TABLE products 
ADD column product_sales integer(11) default 0;

ALTER TABLE departments auto_increment=100;

ALTER TABLE products auto_increment=1000;

ALTER TABLE products 
MODIFY column department_name varchar(30);

INSERT INTO products (product_name, department_name, price, stock_quantity)
values ("Wifi Router", "electronics", "50", 15),
	("Laptop", "electronics", 700, 4),
    ("Candle Sticks", "home goods", 15, 10),
    ("Dishware set", "home goods", 30, 7);
    
INSERT INTO departments (department_name, overhead_cost)
values ("electronics", 14000),
		("home goods", 9000);

select * from products;