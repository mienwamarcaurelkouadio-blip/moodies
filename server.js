
const bcrypt = require("bcryptjs");
const session = require("express-session");
const express = require("express");
const connexion = require("./database");

const app = express();
const port = process.env.PORT || 3000;

// =================================
// SESSION
// =================================

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 2
    }
}));

app.use(express.json());

// =================================
// VERIFICATION ADMIN
// =================================

function verifierAdmin(req, res, next) {
    if (!req.session.admin) {
        return res.redirect("/connexion");
    }

    next();
}

// =================================
// JOURNAL DES REQUETES
// =================================

app.use((req, res, next) => {
    console.log("REQUÊTE REÇUE :", req.method, req.url);
    next();
});

app.use(express.static("public"));

// =================================
// PAGES ADMIN
// =================================

app.get("/admin.html", (req, res) => {
    if (!req.session.admin) {
        return res.redirect("/login.html");
    }

    res.sendFile(__dirname + "/public/admin.html");
});

app.get("/admin", verifierAdmin, (req, res) => {
    res.sendFile(__dirname + "/public/admin.html");
});

app.get("/connexion", (req, res) => {
    if (req.session.admin) {
        return res.redirect("/admin");
    }

    res.sendFile(__dirname + "/public/connexion.html");
});

// =================================
// ADMINISTRATEURS
// =================================

app.get("/api/admin/administrateurs", verifierAdmin, (req, res) => {

    const sql = `
        SELECT id, nom, email, date_creation
        FROM administrateurs
        ORDER BY id DESC
    `;

    connexion.query(sql, (erreur, resultats) => {

        if (erreur) {
            console.error(erreur.message);

            return res.status(500).json({
                message: "Erreur lors du chargement des administrateurs."
            });
        }

        res.json(resultats);
    });
});

app.post("/api/admin/administrateurs", verifierAdmin, async (req, res) => {

    const { nom, email, motDePasse } = req.body;

    if (!nom || !email || !motDePasse) {
        return res.status(400).json({
            message: "Veuillez remplir tous les champs."
        });
    }

    if (motDePasse.length < 8) {
        return res.status(400).json({
            message: "Le mot de passe doit contenir au moins 8 caractères."
        });
    }

    try {

        const motDePasseHash = await bcrypt.hash(motDePasse, 10);

        const sql = `
            INSERT INTO administrateurs (nom, email, mot_de_passe)
            VALUES (?, ?, ?)
        `;

        connexion.query(
            sql,
            [nom, email, motDePasseHash],
            (erreur, resultat) => {

                if (erreur) {

                    if (erreur.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({
                            message: "Cette adresse email est déjà utilisée."
                        });
                    }

                    console.error(erreur.message);

                    return res.status(500).json({
                        message: "Erreur lors de la création du compte."
                    });
                }

                res.status(201).json({
                    message: "Administrateur ajouté avec succès !"
                });
            }
        );

    } catch (erreur) {

        console.error(erreur.message);

        res.status(500).json({
            message: "Erreur lors de la sécurisation du mot de passe."
        });
    }
});

app.delete("/api/admin/administrateurs/:id", verifierAdmin, (req, res) => {

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Identifiant invalide."
        });
    }

    if (id === Number(req.session.admin.id)) {
        return res.status(403).json({
            message: "Vous ne pouvez pas supprimer votre propre compte."
        });
    }

    const sql = "DELETE FROM administrateurs WHERE id = ?";

    connexion.query(sql, [id], (erreur, resultat) => {

        if (erreur) {
            console.error(erreur.message);

            return res.status(500).json({
                message: "Erreur lors de la suppression."
            });
        }

        if (resultat.affectedRows === 0) {
            return res.status(404).json({
                message: "Administrateur introuvable."
            });
        }

        res.json({
            message: "Administrateur supprimé avec succès."
        });
    });
});

// =================================
// ROUTE DE TEST
// =================================

app.get("/test", (req, res) => {
    res.send("Mon premier message venant du serveur !");
});

// =================================
// PANIER TEMPORAIRE
// =================================

let panier = [];

app.post("/api/panier", (req, res) => {

    const produit = req.body;

    panier.push(produit);

    res.json({
        message: "Produit ajouté au panier",
        panier: panier
    });
});

// =================================
// PRODUITS
// =================================

app.get("/api/produits", (req, res) => {

    const sql = "SELECT * FROM produits";

    connexion.query(sql, (erreur, resultats) => {

        if (erreur) {
            console.error("Erreur MySQL :", erreur.message);

            return res.status(500).json({
                message: "Impossible de récupérer les produits."
            });
        }

        res.json(resultats);
    });
});

app.post("/api/produits", verifierAdmin, (req, res) => {

    const { nom, description, prix, image, stock } = req.body;

    if (
        !nom ||
        !description ||
        prix === undefined ||
        prix === "" ||
        !image ||
        stock === undefined ||
        stock === ""
    ) {
        return res.status(400).json({
            message: "Veuillez remplir tous les champs."
        });
    }

    if (
        !Number.isFinite(Number(prix)) ||
        Number(prix) <= 0 ||
        !Number.isInteger(Number(stock)) ||
        Number(stock) < 0
    ) {
        return res.status(400).json({
            message: "Prix ou stock invalide."
        });
    }

    const sql = `
        INSERT INTO produits
        (nom, description, prix, image, stock)
        VALUES (?, ?, ?, ?, ?)
    `;

    connexion.query(
        sql,
        [nom, description, Number(prix), image, Number(stock)],
        (erreur, resultat) => {

            if (erreur) {
                console.error(erreur.message);

                return res.status(500).json({
                    message: "Erreur lors de l'ajout du produit."
                });
            }

            res.status(201).json({
                message: "Produit ajouté avec succès !",
                id: resultat.insertId
            });
        }
    );
});

app.put("/api/produits/:id", verifierAdmin, (req, res) => {

    const id = Number(req.params.id);

    const { nom, description, prix, image, stock } = req.body;

    if (
        !Number.isInteger(id) || id <= 0 ||
        !nom?.trim() ||
        !description?.trim() ||
        !image?.trim() ||
        prix === undefined || prix === "" ||
        stock === undefined || stock === ""
    ) {
        return res.status(400).json({
            message: "Informations invalides."
        });
    }

    if (
        !Number.isFinite(Number(prix)) ||
        Number(prix) <= 0 ||
        !Number.isInteger(Number(stock)) ||
        Number(stock) < 0
    ) {
        return res.status(400).json({
            message: "Prix ou stock invalide."
        });
    }

    const sql = `
        UPDATE produits
        SET nom = ?, description = ?, prix = ?, image = ?, stock = ?
        WHERE id = ?
    `;

    connexion.query(
        sql,
        [
            nom.trim(),
            description.trim(),
            Number(prix),
            image.trim(),
            Number(stock),
            id
        ],
        (erreur, resultat) => {

            if (erreur) {
                console.error(erreur.message);

                return res.status(500).json({
                    message: "Erreur lors de la modification."
                });
            }

            if (resultat.affectedRows === 0) {
                return res.status(404).json({
                    message: "Produit introuvable."
                });
            }

            res.json({
                message: "Produit modifié avec succès !"
            });
        }
    );
});

app.delete("/api/produits/:id", verifierAdmin, (req, res) => {

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Identifiant invalide."
        });
    }

    const sql = "DELETE FROM produits WHERE id = ?";

    connexion.query(sql, [id], (erreur, resultat) => {

        if (erreur) {
            console.error(erreur.message);

            return res.status(500).json({
                message: "Erreur lors de la suppression."
            });
        }

        if (resultat.affectedRows === 0) {
            return res.status(404).json({
                message: "Produit introuvable."
            });
        }

        res.json({
            message: "Produit supprimé avec succès !"
        });
    });
});

// =================================
// ENREGISTRER UNE COMMANDE
// =================================

app.post("/api/commandes", (req, res) => {

    const {
        nom,
        telephone,
        modeReception,
        adresse,
        modePaiement,
        produits
    } = req.body;

    if (
        !nom?.trim() ||
        !telephone?.trim() ||
        !["Livraison à domicile", "Retrait sur place"].includes(modeReception) ||
        !modePaiement ||
        !Array.isArray(produits) ||
        produits.length === 0
    ) {
        return res.status(400).json({
            message: "Informations de commande invalides."
        });
    }

    if (
        modeReception === "Livraison à domicile" &&
        !adresse?.trim()
    ) {
        return res.status(400).json({
            message: "Veuillez renseigner votre adresse."
        });
    }

    const quantites = new Map();

    for (const produit of produits) {

        const id = Number(produit.id);
        const quantite = Number(produit.quantite);

        if (
            !Number.isInteger(id) || id <= 0 ||
            !Number.isInteger(quantite) || quantite <= 0
        ) {
            return res.status(400).json({
                message: "Un produit ou une quantité est invalide."
            });
        }

        quantites.set(
            id,
            (quantites.get(id) || 0) + quantite
        );
    }

    const ids = [...quantites.keys()];

    // Obtenir une véritable connexion pour la transaction
    connexion.getConnection((erreurConnexion, connection) => {

        if (erreurConnexion) {
            console.error("Connexion MySQL :", erreurConnexion.message);

            return res.status(500).json({
                message: "Impossible de se connecter à la base de données."
            });
        }

        const executer = (sql, valeurs = []) => {
            return new Promise((resolve, reject) => {

                connection.query(sql, valeurs, (erreur, resultat) => {

                    if (erreur) {
                        return reject(erreur);
                    }

                    resolve(resultat);
                });
            });
        };

        connection.beginTransaction(async (erreurTransaction) => {

            if (erreurTransaction) {
                console.error(erreurTransaction.message);
                connection.release();

                return res.status(500).json({
                    message: "Impossible de démarrer la commande."
                });
            }

            try {

                // Verrouiller les produits pendant la commande
                const placeholders = ids.map(() => "?").join(",");

                const sqlProduits = `
                    SELECT id, nom, prix, stock
                    FROM produits
                    WHERE id IN (${placeholders})
                    FOR UPDATE
                `;

                const produitsBDD = await executer(sqlProduits, ids);

                if (produitsBDD.length !== ids.length) {
                    throw new Error("Un produit de votre panier n'existe plus.");
                }

                let sousTotal = 0;

                for (const produit of produitsBDD) {

                    const quantite = quantites.get(produit.id);

                    if (produit.stock < quantite) {
                        throw new Error(
                            `Stock insuffisant pour : ${produit.nom}`
                        );
                    }

                    sousTotal += Number(produit.prix) * quantite;
                }

                const fraisLivraison =
                    modeReception === "Livraison à domicile" ? 1000 : 0;

                const total = sousTotal + fraisLivraison;

                const adresseFinale =
                    modeReception === "Livraison à domicile"
                        ? adresse.trim()
                        : "";

                // Enregistrer la commande
                const sqlCommande = `
                    INSERT INTO commandes
                    (nom_client, telephone, adresse, total,
                     mode_reception, mode_paiement)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;

                const resultatCommande = await executer(sqlCommande, [
                    nom.trim(),
                    telephone.trim(),
                    adresseFinale,
                    total,
                    modeReception,
                    modePaiement
                ]);

                const commandeId = resultatCommande.insertId;

                // Enregistrer les détails et diminuer le stock
                for (const produit of produitsBDD) {

                    const quantite = quantites.get(produit.id);

                    await executer(
                        `INSERT INTO details_commandes
                        (commande_id, produit_id, quantite, prix_unitaire)
                        VALUES (?, ?, ?, ?)`,
                        [
                            commandeId,
                            produit.id,
                            quantite,
                            produit.prix
                        ]
                    );

                    await executer(
                        `UPDATE produits
                        SET stock = stock - ?
                        WHERE id = ?`,
                        [quantite, produit.id]
                    );
                }

                // Valider la transaction
                connection.commit((erreurCommit) => {

                    if (erreurCommit) {

                        return connection.rollback(() => {

                            connection.release();

                            console.error(erreurCommit.message);

                            res.status(500).json({
                                message: "Impossible de valider la commande."
                            });
                        });
                    }

                    connection.release();

                    res.status(201).json({
                        message: "Commande enregistrée avec succès !",
                        commandeId: commandeId,
                        total: total
                    });
                });

            } catch (erreur) {

                connection.rollback(() => {

                    connection.release();

                    console.error("Erreur commande :", erreur.message);

                    const erreurStock =
                        erreur.message.startsWith("Stock insuffisant") ||
                        erreur.message.includes("n'existe plus");

                    res.status(erreurStock ? 409 : 500).json({
                        message: erreur.message
                    });
                });
            }
        });
    });
});

// =================================
// AFFICHER TOUTES LES COMMANDES
// =================================

app.get("/api/commandes", verifierAdmin, (req, res) => {

    const sql = `
        SELECT
            c.*,
            dc.quantite,
            dc.prix_unitaire,
            p.nom AS produit_nom
        FROM commandes c
        LEFT JOIN details_commandes dc
            ON c.id = dc.commande_id
        LEFT JOIN produits p
            ON dc.produit_id = p.id
        ORDER BY c.date_commande DESC, c.id DESC
    `;

    connexion.query(sql, (erreur, resultats) => {

        if (erreur) {
            console.error(erreur.message);

            return res.status(500).json({
                message: "Impossible de récupérer les commandes."
            });
        }

        const commandes = {};

        resultats.forEach(ligne => {

            if (!commandes[ligne.id]) {
                commandes[ligne.id] = {
                    id: ligne.id,
                    nom_client: ligne.nom_client,
                    telephone: ligne.telephone,
                    adresse: ligne.adresse,
                    total: ligne.total,
                    statut: ligne.statut,
                    date_commande: ligne.date_commande,
                    mode_reception: ligne.mode_reception,
                    mode_paiement: ligne.mode_paiement,
                    produits: []
                };
            }

            if (ligne.produit_nom) {
                commandes[ligne.id].produits.push({
                    nom: ligne.produit_nom,
                    quantite: ligne.quantite,
                    prix: ligne.prix_unitaire
                });
            }
        });

        res.json(Object.values(commandes));
    });
});

// =================================
// COMMANDES AVEC PAGINATION ET FILTRES
// =================================

app.get("/api/commandes/paginees", verifierAdmin, (req, res) => {

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limite = 10;
    const debut = (page - 1) * limite;

    const statut = req.query.statut || "";
    const recherche = req.query.recherche || "";

    let conditions = [];
    let valeurs = [];

    if (statut) {
        conditions.push("statut = ?");
        valeurs.push(statut);
    }

    if (recherche) {

        conditions.push(
            "(CAST(id AS CHAR) LIKE ? OR nom_client LIKE ? OR telephone LIKE ?)"
        );

        const terme = `%${recherche}%`;

        valeurs.push(terme, terme, terme);
    }

    const where = conditions.length
        ? "WHERE " + conditions.join(" AND ")
        : "";

    const sqlTotal = `
        SELECT COUNT(*) AS total
        FROM commandes
        ${where}
    `;

    connexion.query(sqlTotal, valeurs, (erreur, resultatTotal) => {

        if (erreur) {
            console.error(erreur.message);

            return res.status(500).json({
                message: "Erreur lors du comptage des commandes."
            });
        }

        const total = resultatTotal[0].total;
        const totalPages = Math.ceil(total / limite);

        const sqlCommandes = `
            SELECT
                c.*,
                dc.quantite,
                dc.prix_unitaire,
                p.nom AS produit_nom
            FROM (
                SELECT *
                FROM commandes
                ${where}
                ORDER BY date_commande DESC, id DESC
                LIMIT ? OFFSET ?
            ) c
            LEFT JOIN details_commandes dc
                ON c.id = dc.commande_id
            LEFT JOIN produits p
                ON dc.produit_id = p.id
            ORDER BY c.date_commande DESC, c.id DESC
        `;

        connexion.query(
            sqlCommandes,
            [...valeurs, limite, debut],
            (erreur, resultats) => {

                if (erreur) {
                    console.error(erreur.message);

                    return res.status(500).json({
                        message: "Erreur lors du chargement des commandes."
                    });
                }

                const commandes = {};

                resultats.forEach(ligne => {

                    if (!commandes[ligne.id]) {
                        commandes[ligne.id] = {
                            id: ligne.id,
                            nom_client: ligne.nom_client,
                            telephone: ligne.telephone,
                            adresse: ligne.adresse,
                            total: ligne.total,
                            statut: ligne.statut,
                            date_commande: ligne.date_commande,
                            mode_reception: ligne.mode_reception,
                            mode_paiement: ligne.mode_paiement,
                            produits: []
                        };
                    }

                    if (ligne.produit_nom) {
                        commandes[ligne.id].produits.push({
                            nom: ligne.produit_nom,
                            quantite: ligne.quantite,
                            prix: ligne.prix_unitaire
                        });
                    }
                });

                res.json({
                    commandes: Object.values(commandes),
                    total: total,
                    page: page,
                    totalPages: totalPages
                });
            }
        );
    });
});

// =================================
// MODIFIER LE STATUT D'UNE COMMANDE
// =================================

app.put("/api/commandes/:id/statut", verifierAdmin, (req, res) => {

    const id = Number(req.params.id);
    const { statut } = req.body;

    const statutsAutorises = [
        "En attente",
        "En préparation",
        "Prête",
        "Livrée",
        "Annulée"
    ];

    if (
        !Number.isInteger(id) ||
        id <= 0 ||
        !statutsAutorises.includes(statut)
    ) {
        return res.status(400).json({
            message: "Identifiant ou statut invalide."
        });
    }

    const sql = "UPDATE commandes SET statut = ? WHERE id = ?";

    connexion.query(sql, [statut, id], (erreur, resultat) => {

        if (erreur) {
            console.error(erreur.message);

            return res.status(500).json({
                message: "Erreur lors de la modification du statut."
            });
        }

        if (resultat.affectedRows === 0) {
            return res.status(404).json({
                message: "Commande introuvable."
            });
        }

        connexion.query(
            "SELECT id, nom_client, telephone FROM commandes WHERE id = ?",
            [id],
            (erreurLecture, commandes) => {

                if (erreurLecture) {
                    console.error(erreurLecture.message);

                    return res.status(500).json({
                        message: "Statut modifié, mais impossible de récupérer les informations du client."
                    });
                }

                res.json({
                    message: "Statut de la commande modifié !",
                    commande: commandes[0]
                });
            }
        );
    });
});

// =================================
// STATISTIQUES DU TABLEAU DE BORD
// =================================

app.get("/api/statistiques", verifierAdmin, (req, res) => {

    const sql = `
        SELECT
            COUNT(*) AS nombre_commandes,

            COALESCE(
                SUM(CASE
                    WHEN statut = 'Livrée' THEN total
                    ELSE 0
                END), 0
            ) AS chiffre_affaires,

            COALESCE(
                SUM(CASE
                    WHEN statut = 'En attente' THEN 1
                    ELSE 0
                END), 0
            ) AS commandes_attente,

            COALESCE(
                SUM(CASE
                    WHEN statut = 'Livrée' THEN 1
                    ELSE 0
                END), 0
            ) AS commandes_livrees

        FROM commandes
    `;

    connexion.query(sql, (erreur, resultats) => {

        if (erreur) {
            console.error("Erreur statistiques :", erreur.message);

            return res.status(500).json({
                message: "Erreur lors du chargement des statistiques."
            });
        }

        res.json(resultats[0]);
    });
});

// =================================
// EVOLUTION DES VENTES SUR 7 JOURS
// =================================

app.get("/api/statistiques/ventes", verifierAdmin, (req, res) => {

    const sql = `
        SELECT
            DATE(date_commande) AS date,

            COALESCE(
                SUM(CASE
                    WHEN statut = 'Livrée' THEN total
                    ELSE 0
                END), 0
            ) AS chiffre_affaires

        FROM commandes

        WHERE date_commande >= CURDATE() - INTERVAL 6 DAY

        GROUP BY DATE(date_commande)

        ORDER BY date ASC
    `;

    connexion.query(sql, (erreur, resultats) => {

        if (erreur) {
            console.error("Erreur graphique :", erreur.message);

            return res.status(500).json({
                message: "Erreur lors du chargement des ventes."
            });
        }

        res.json(resultats);
    });
});

// =================================
// CONNEXION ADMINISTRATEUR
// =================================

app.post("/api/admin/connexion", (req, res) => {

    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
        return res.status(400).json({
            message: "Veuillez remplir tous les champs."
        });
    }

    const sql = "SELECT * FROM administrateurs WHERE email = ?";

    connexion.query(sql, [email], async (erreur, resultats) => {

        if (erreur) {
            console.error(erreur.message);

            return res.status(500).json({
                message: "Erreur du serveur."
            });
        }

        if (resultats.length === 0) {
            return res.status(401).json({
                message: "Email ou mot de passe incorrect."
            });
        }

        const administrateur = resultats[0];

        const motDePasseCorrect = await bcrypt.compare(
            motDePasse,
            administrateur.mot_de_passe
        );

        if (!motDePasseCorrect) {
            return res.status(401).json({
                message: "Email ou mot de passe incorrect."
            });
        }

        req.session.regenerate((erreurRegeneration) => {

            if (erreurRegeneration) {
                console.error(erreurRegeneration.message);

                return res.status(500).json({
                    message: "Impossible de sécuriser la session."
                });
            }

            req.session.admin = {
                id: administrateur.id,
                nom: administrateur.nom,
                email: administrateur.email
            };

            req.session.save((erreurSession) => {

                if (erreurSession) {
                    console.error(erreurSession.message);

                    return res.status(500).json({
                        message: "Impossible de créer la session."
                    });
                }

                res.json({
                    message: "Connexion réussie !"
                });
            });
        });
    });
});

// =================================
// DECONNEXION ADMINISTRATEUR
// =================================

app.post("/api/admin/deconnexion", (req, res) => {

    req.session.destroy((erreur) => {

        if (erreur) {
            return res.status(500).json({
                message: "Erreur lors de la déconnexion."
            });
        }

        res.json({
            message: "Déconnexion réussie !"
        });
    });
});

// =================================
// TEST SUIVI DE COMMANDE
// =================================

app.get("/api/test-suivi", (req, res) => {

    console.log("TEST SUIVI ATTEINT");

    res.send("ROUTE TEST OK");
});

// =================================
// SUIVI DE COMMANDE
// =================================

app.post("/api/suivi-commande", (req, res) => {

    console.log("ROUTE SUIVI APPELEE", req.body);

    const { numeroCommande, telephone } = req.body;

    if (!numeroCommande || !telephone) {
        return res.status(400).json({
            message: "Veuillez remplir tous les champs."
        });
    }

    const sql = `
        SELECT
            id,
            nom_client,
            telephone,
            statut,
            total,
            date_commande,
            mode_reception
        FROM commandes
        WHERE id = ? AND telephone = ?
    `;

    connexion.query(
        sql,
        [numeroCommande, telephone],
        (erreur, resultats) => {

            if (erreur) {
                console.error(erreur.message);

                return res.status(500).json({
                    message: "Erreur lors de la recherche de votre commande."
                });
            }

            if (resultats.length === 0) {
                return res.status(404).json({
                    message: "Aucune commande trouvée. Vérifiez votre numéro de commande et votre téléphone."
                });
            }

            res.json(resultats[0]);
        }
    );
});

// =================================
// DEMARRER LE SERVEUR
// =================================

console.log("VERSION TEST SUIVI CHARGEE");

app.listen(port, () => {
    console.log(`Serveur lancé sur http://localhost:${port}`);
});
