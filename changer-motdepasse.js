const connexion = require("./database");
const bcrypt = require("bcryptjs");

// Remplace par tes vraies informations
const ancienEmail = "admin@snackspot.com";
const nouvelEmail = "mienwamarcaurelkouadio@gmail.com";
const nouveauMotDePasse = "SOGMienwa";

async function modifierCompte() {
    try {
        const hash = await bcrypt.hash(nouveauMotDePasse, 10);

        connexion.query(
            `UPDATE administrateurs
             SET email = ?, mot_de_passe = ?
             WHERE email = ?`,
            [nouvelEmail, hash, ancienEmail],
            (erreur, resultat) => {
                if (erreur) {
                    console.error("Erreur :", erreur.message);
                } else if (resultat.affectedRows === 0) {
                    console.log("Ancien compte introuvable.");
                } else {
                    console.log("Email et mot de passe modifiés avec succès !");
                }

                connexion.end();
            }
        );
    } catch (erreur) {
        console.error(erreur);
        connexion.end();
    }
}

modifierCompte();