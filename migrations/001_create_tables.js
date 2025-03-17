const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    port: Number(process.env.DB_PORT) || 3306,
    database: 'pyeonhaeng', // 이미 존재한다고 가정 (services.mysql.env.MYSQL_DATABASE로 생성)
  });

  // users
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      user_id VARCHAR(50) PRIMARY KEY,
      user_password VARCHAR(255) NOT NULL,
      user_name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // products
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS products (
      product_id INT AUTO_INCREMENT PRIMARY KEY,
      product_name VARCHAR(255) NOT NULL,
      product_price INT NOT NULL,
      product_image TEXT,
      product_desc TEXT,
      view_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // recipes
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS recipes (
      recipe_id INT AUTO_INCREMENT PRIMARY KEY,
      recipe_name VARCHAR(255) NOT NULL,
      recipe_content TEXT,
      recipe_like INT DEFAULT 0,
      recipe_dislike INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // reviews (FK: user_id → users, recipe_id → recipes)
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      review_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      recipe_id INT NOT NULL,
      review_rating INT,
      review_like INT DEFAULT 0,
      review_dislike INT DEFAULT 0,
      review_content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);

  // recipe_product (FK: recipe_id → recipes, product_id → products)
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS recipe_product (
      rp_id INT AUTO_INCREMENT PRIMARY KEY,
      recipe_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(product_id) ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);

  // bookmark_product (FK: user_id → users, product_id → products)
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS bookmark_product (
      bookmark_p_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      product_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(product_id) ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);

  // bookmark_recipe (FK: user_id → users, recipe_id → recipes)
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS bookmark_recipe (
      bookmark_r_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      recipe_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);

  await connection.end();
  console.log("Migration complete");
}

// 실행
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
