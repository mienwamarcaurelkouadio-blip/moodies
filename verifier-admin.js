const connexion = require("./database");

connexion.query(
    "SELECT id, nom, email FROM administrateurs",
    (erreur, resultats) => {
        if (erreur) {
            console.error("Erreur :", erreur.message);
        } else {
            console.log("Comptes administrateurs :");
            console.table(resultats);
        }

        connexion.end();
    }
);