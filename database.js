require("dotenv").config();
const mysql = require("mysql2");

const utiliserTiDB = process.env.DB_MODE === "cloud";

const options = utiliserTiDB
    ? {
        host: process.env.TIDB_HOST,
        user: process.env.TIDB_USER,
        password: process.env.TIDB_PASSWORD,
        database: process.env.TIDB_DATABASE,
        port: Number(process.env.TIDB_PORT),
        ssl: process.env.TIDB_ENABLE_SSL === "true"
            ? { minVersion: "TLSv1.2" }
            : undefined
    }
    : {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT)
    };

const connexion = mysql.createConnection(options);

connexion.connect((erreur) => {
    if (erreur) {
        console.error("Erreur de connexion à la base de données :", erreur.message);
        return;
    }

    console.log(
        utiliserTiDB
            ? "Connexion à TiDB Cloud réussie !"
            : "Connexion à MySQL local réussie !"
    );
});

module.exports = connexion;