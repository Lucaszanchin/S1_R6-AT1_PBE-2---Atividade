import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Singleton para a conexão com o banco de dados
class Database {
    static #instance = null;
    #pool = null;


    #createPool() {
        this.#pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            port: process.env.DB_PORT,
            waitForConnections: true,
            connectionLimit: 100,
            queueLimit: 0,
            ssl: {
                rejectUnauthorized: false
            }
        });
    }


    static getInstance() {
        if (!Database.#instance) {
            Database.#instance = new Database();
            Database.#instance.#createPool();
        }
        return Database.#instance;
    }


    getPool() {
        return this.#pool;
    }
}

export async function initializeDatabase() {
    console.log("Inicializando o banco de dados e tabelas com base no schema real...");
    try {
        const tempConnection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            ssl: { rejectUnauthorized: false }
        });

        // Garante o uso do banco correto (padrão technova_database caso não configurado)
        const dbName = process.env.DB_DATABASE || 'technova_database';

        await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await tempConnection.query(`USE \`${dbName}\`;`);

        // 1. Tabela: categorias
        await tempConnection.query(`
            CREATE TABLE IF NOT EXISTS \`categorias\` (
              \`id_categoria\` INT NOT NULL AUTO_INCREMENT,
              \`nome_categoria\` VARCHAR(100) NOT NULL,
              \`descricao_categoria\` VARCHAR(255) DEFAULT NULL,
              PRIMARY KEY (\`id_categoria\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Tabela: produtos
        await tempConnection.query(`
            CREATE TABLE IF NOT EXISTS \`produtos\` (
              \`id_produto\` INT NOT NULL AUTO_INCREMENT,
              \`nome_produto\` VARCHAR(100) NOT NULL,
              \`descricao_produto\` TEXT DEFAULT NULL,
              \`preco_produto\` DECIMAL(10,2) NOT NULL,
              \`imagem_produto\` VARCHAR(255) DEFAULT NULL,
              \`estoque_produto\` INT NOT NULL DEFAULT '0',
              \`id_categoria\` INT NOT NULL,
              PRIMARY KEY (\`id_produto\`),
              CONSTRAINT \`fk_produtos_categoria\` FOREIGN KEY (\`id_categoria\`) REFERENCES \`categorias\` (\`id_categoria\`) ON DELETE RESTRICT ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Tabela: pedidos
        await tempConnection.query(`
            CREATE TABLE IF NOT EXISTS \`pedidos\` (
              \`id_pedido\` INT NOT NULL AUTO_INCREMENT,
              \`data_pedido\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              \`status_pedido\` ENUM('PENDENTE','PAGO','ENVIADO','ENTREGUE','CANCELADO') NOT NULL DEFAULT 'PENDENTE',
              \`valor_total\` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
              PRIMARY KEY (\`id_pedido\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 4. Tabela: itens_pedido
        await tempConnection.query(`
            CREATE TABLE IF NOT EXISTS \`itens_pedido\` (
              \`id_item_pedido\` INT NOT NULL AUTO_INCREMENT,
              \`quantidade\` INT NOT NULL,
              \`preco_unitario\` DECIMAL(10,2) NOT NULL,
              \`subtotal\` DECIMAL(10,2) DEFAULT NULL,
              \`id_produto\` INT NOT NULL,
              \`id_pedido\` INT NOT NULL,
              PRIMARY KEY (\`id_item_pedido\`),
              CONSTRAINT \`fk_itens_pedido\` FOREIGN KEY (\`id_pedido\`) REFERENCES \`pedidos\` (\`id_pedido\`) ON DELETE CASCADE ON UPDATE CASCADE,
              CONSTRAINT \`fk_itens_produto\` FOREIGN KEY (\`id_produto\`) REFERENCES \`produtos\` (\`id_produto\`) ON DELETE RESTRICT ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await tempConnection.end();
        console.log("Banco de dados e tabelas verificados/criados com sucesso de acordo com o schema oficial.");
    } catch (error) {
        console.error("Erro ao criar o banco ou as tabelas:", error);
        throw error;
    }
}