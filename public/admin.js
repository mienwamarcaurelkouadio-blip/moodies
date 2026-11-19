
/* =================================
   1. RECUPERER LES ELEMENTS HTML
================================= */

const formulaire = document.getElementById("form-produit");

const tableProduits = document.getElementById("table-produits");

const nombreProduits = document.getElementById("nombre-produits");

const stockTotal = document.getElementById("stock-total");

const message = document.getElementById("message");


// Récupérer le formulaire de modification
const formulaireModification = document.getElementById("form-modification");

// Récupérer la fenêtre Bootstrap
const modalModification = new bootstrap.Modal(
    document.getElementById("modalModification")
);

/* =================================
   2. AFFICHER LES PRODUITS
================================= */


async function chargerProduits() {

    try {

        const reponse = await fetch("/api/produits", {
            cache: "no-store"
        });

        if (!reponse.ok) {
            throw new Error("Impossible de récupérer les produits");
        }

        const produits = await reponse.json();

        tableProduits.innerHTML = "";

        let totalStock = 0;

        produits.forEach(produit => {

            totalStock += Number(produit.stock);

            tableProduits.innerHTML += `
                <tr>

                    <td>${produit.id}</td>

                    <td>
                        <img
                            src="/${encodeURIComponent(produit.image)}"
                            alt="${produit.nom}"
                            width="55"
                            height="55"
                            style="object-fit:cover;border-radius:8px;"
                        >
                    </td>

                    <td>${produit.nom}</td>

                    <td>${produit.prix} FCFA</td>

                    <td>
                        <span class="badge ${produit.stock > 0 ? "bg-success" : "bg-danger"}">
                            ${produit.stock}
                        </span>
                    </td>

                    <td>
                        <button
                            class="btn btn-sm btn-warning mb-1"
                            onclick="modifierProduit(${produit.id})">
                            Modifier
                        </button>

                        <button
                            class="btn btn-sm btn-danger mb-1"
                            onclick="supprimerProduit(${produit.id})">
                            Supprimer
                        </button>
                    </td>

                </tr>
            `;

        });

        if (produits.length === 0) {

            tableProduits.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        Aucun produit disponible.
                    </td>
                </tr>
            `;

        }

        nombreProduits.textContent = produits.length;
        stockTotal.textContent = totalStock;

    } catch (erreur) {

        console.error(erreur);

        tableProduits.innerHTML = `
            <tr>
                <td colspan="6" class="text-danger text-center">
                    Erreur de chargement des produits.
                </td>
            </tr>
        `;

    }

}


async function modifierProduit(id) {

    try {

        const reponse = await fetch("/api/produits");

        const produits = await reponse.json();

        const produit = produits.find(p => p.id === id);

        if (!produit) {
            alert("Produit introuvable !");
            return;
        }

        document.getElementById("edit-id").value = produit.id;
        document.getElementById("edit-nom").value = produit.nom;
        document.getElementById("edit-prix").value = produit.prix;
        document.getElementById("edit-description").value = produit.description;
        document.getElementById("edit-image").value = produit.image;
        document.getElementById("edit-stock").value = produit.stock;

        modalModification.show();

    } catch (erreur) {

        console.error(erreur);
        alert("Impossible de récupérer le produit.");

    }

}


formulaireModification.addEventListener("submit", async (e) => {

    e.preventDefault();

    const id = document.getElementById("edit-id").value;

    const produit = {

        nom: document.getElementById("edit-nom").value.trim(),

        prix: Number(document.getElementById("edit-prix").value),

        description: document.getElementById("edit-description").value.trim(),

        image: document.getElementById("edit-image").value.trim(),

        stock: Number(document.getElementById("edit-stock").value)

    };

    const messageModification = document.getElementById("message-modification");

    try {

        const reponse = await fetch(`/api/produits/${id}`, {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(produit)

        });

        const resultat = await reponse.json();

        if (!reponse.ok) {
            throw new Error(resultat.message);
        }

        messageModification.textContent = resultat.message;
        messageModification.className = "text-success";

        await chargerProduits();

        setTimeout(() => {
            modalModification.hide();
        }, 1000);

    } catch (erreur) {

        messageModification.textContent = erreur.message;
        messageModification.className = "text-danger";

    }

});



async function supprimerProduit(id) {

    const confirmation = confirm(
        "Voulez-vous vraiment supprimer cette crêpe ?"
    );

    if (!confirmation) return;

    try {

        const reponse = await fetch(`/api/produits/${id}`, {

            method: "DELETE"

        });

        const resultat = await reponse.json();

        if (!reponse.ok) {
            throw new Error(resultat.message);
        }

        alert(resultat.message);

        await chargerProduits();

    } catch (erreur) {

        console.error(erreur);
        alert(erreur.message);

    }

}
chargerProduits();


/* =================================
   GESTION DES COMMANDES
================================= */

const tableCommandes = document.getElementById("table-commandes");


let pageCommandes = 1;

async function chargerCommandes() {

    try {

        const recherche = document.getElementById("recherche-commandes").value;
        const statut = document.getElementById("filtre-statut-commandes").value;

        const url = `/api/commandes/paginees?page=${pageCommandes}&recherche=${encodeURIComponent(recherche)}&statut=${encodeURIComponent(statut)}`;

        const reponse = await fetch(url, {
            cache: "no-store"
        });

        if (!reponse.ok) {
            throw new Error("Impossible de récupérer les commandes.");
        }

        const resultat = await reponse.json();

        const commandes = resultat.commandes;

        tableCommandes.innerHTML = "";

        if (commandes.length === 0) {

            tableCommandes.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        Aucune commande trouvée.
                    </td>
                </tr>
            `;

        } else {

            commandes.forEach(commande => {

                const produits = commande.produits.map(produit =>
                    `${produit.nom} x ${produit.quantite}`
                ).join("<br>");

                const date = new Date(commande.date_commande)
                    .toLocaleString("fr-FR");

                const options = [
                    "En attente",
                    "En préparation",
                    "Prête",
                    "Livrée",
                    "Annulée"
                ];
function obtenirCouleurStatut(statut) {

    const couleurs = {
        "En attente": "#ffc107",
        "En préparation": "#0dcaf0",
        "Prête": "#198754",
        "Livrée": "#6c757d",
        "Annulée": "#dc3545"
    };

    return couleurs[statut] || "#ffffff";
}
                const menuStatut = options.map(statut => `
                    <option value="${statut}"
                        ${commande.statut === statut ? "selected" : ""}>
                        ${statut}
                    </option>
                `).join("");

                tableCommandes.innerHTML += `
                    <tr>
                        <td>#${commande.id}</td>

                        <td>
                            <strong>${commande.nom_client}</strong><br>
                            <small>${commande.telephone}</small>
                        </td>

                        <td>${produits}</td>

                        <td>
                            <strong>${commande.total} FCFA</strong>
                        </td>

                        <td>${commande.mode_reception}</td>

                        <td>${date}</td>

                        <td>
    <select
        class="form-select form-select-sm select-statut"
        style="background-color: ${obtenirCouleurStatut(commande.statut)}; color: #212529;"
        data-id="${commande.id}">
        ${menuStatut}
    </select>
</td>
                        </td>
                    </tr>
                `;

            });

            // Écouter les changements de statut
            document.querySelectorAll(".select-statut").forEach(select => {

                select.addEventListener("change", async function() {

                    await modifierStatutCommande(
                        this.dataset.id,
                        this.value
                    );

                });

            });

        }

        // Mettre à jour les informations de pagination
        document.getElementById("info-pagination-commandes").textContent =
            `Page ${resultat.page} sur ${resultat.totalPages} (${resultat.total} commandes)`;

        document.getElementById("btn-page-precedente").disabled =
            resultat.page <= 1;

        document.getElementById("btn-page-suivante").disabled =
            resultat.page >= resultat.totalPages;

    } catch (erreur) {

        console.error(erreur);

        tableCommandes.innerHTML = `
            <tr>
                <td colspan="7" class="text-danger text-center">
                    Erreur de chargement des commandes.
                </td>
            </tr>
        `;

    }

}


/* =================================
   MODIFIER LE STATUT
================================= */




async function modifierStatutCommande(id, statut) {

    // Préparer WhatsApp uniquement si la commande est prête
    const fenetreWhatsApp = statut === "Prête"
        ? window.open("about:blank", "_blank")
        : null;

    try {

        const reponse = await fetch(`/api/commandes/${id}/statut`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ statut })
        });

        const resultat = await reponse.json();

        if (!reponse.ok) {
            throw new Error(resultat.message);
        }

        alert(resultat.message);

        // Notification WhatsApp lorsque la commande est prête
        if (statut === "Prête" && resultat.commande) {

            const client = resultat.commande;

            let telephone = String(client.telephone).replace(/\D/g, "");

            if (!telephone.startsWith("225")) {
                telephone = "225" + telephone;
            }

            const message =
    `Bonjour ${client.nom_client} ! 😊\n\n` +
    `Votre commande N°${client.id} chez THE SNACK SPOT est prête ! 🥞\n\n` +
    `📍 POINT DE RETRAIT :\n` +
    `Graduate School of Management (GSM), Palmeraie, Abidjan.\n` +
    `Lieu précis : Entrée principale.\n\n` +
    `Nous vous attendons ! Merci pour votre confiance. ❤️`;
            const lienWhatsApp =
                `https://wa.me/${telephone}?text=${encodeURIComponent(message)}`;

            if (fenetreWhatsApp) {
                fenetreWhatsApp.location.href = lienWhatsApp;
            }
        }

        await chargerCommandes();

    } catch (erreur) {

        console.error(erreur);

        if (fenetreWhatsApp) {
            fenetreWhatsApp.close();
        }

        alert(erreur.message);

        await chargerCommandes();
    }
}


// Charger les commandes au démarrage
chargerCommandes();


// =================================
// STATISTIQUES COMMERCIALES
// =================================

async function chargerStatistiques() {

    try {

        const reponse = await fetch("/api/statistiques");
        if (!reponse.ok) {
            throw new Error("Impossible de charger les statistiques.");
        }

        const stats = await reponse.json();

        document.getElementById("stat-total-commandes").textContent =
            stats.nombre_commandes;

        document.getElementById("stat-chiffre-affaires").textContent =
            Number(stats.chiffre_affaires).toLocaleString("fr-FR") + " FCFA";

        document.getElementById("stat-commandes-attente").textContent =
            stats.commandes_attente;

        document.getElementById("stat-commandes-livrees").textContent =
            stats.commandes_livrees;

    } catch (erreur) {

        console.error("Erreur statistiques :", erreur);

    }

}

chargerStatistiques();


// =================================
// GRAPHIQUE DES VENTES
// =================================

async function chargerGraphiqueVentes() {

    try {

        const reponse = await fetch("/api/statistiques/ventes");

        if (!reponse.ok) {
            throw new Error("Impossible de charger les ventes.");
        }

        const ventes = await reponse.json();

        const dates = ventes.map(vente =>
            new Date(vente.date).toLocaleDateString("fr-FR")
        );

        const chiffres = ventes.map(vente =>
            Number(vente.chiffre_affaires)
        );

        const contexte = document
            .getElementById("graphique-ventes")
            .getContext("2d");

        new Chart(contexte, {

            type: "bar",

            data: {
                labels: dates,

                datasets: [{
                    label: "Chiffre d'affaires (FCFA)",
                    data: chiffres,
                    backgroundColor: "#ffc107",
                    borderRadius: 8
                }]
            },

            options: {
                responsive: true,

                plugins: {
                    legend: {
                        display: true
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }

        });

    } catch (erreur) {

        console.error("Erreur graphique :", erreur);

    }

}

chargerGraphiqueVentes();


/* =================================
   NOTIFICATIONS NOUVELLES COMMANDES
================================= */

let dernierIdCommande = 0;
let compteurNouvellesCommandes = 0;
let premiereVerification = true;


/* =================================
   NOTIFICATIONS NOUVELLES COMMANDES
================================= */



async function verifierNouvellesCommandes() {

    try {

        const reponse = await fetch("/api/commandes", {
            cache: "no-store"
        });

        if (!reponse.ok) {
            throw new Error("Impossible de vérifier les commandes.");
        }

        const commandes = await reponse.json();

        // Trouver le dernier identifiant connu
        const dernierIdActuel = commandes.length > 0
            ? Math.max(...commandes.map(c => Number(c.id)))
            : 0;

        // Initialiser la référence au premier chargement
        if (premiereVerification) {

            dernierIdCommande = dernierIdActuel;
            premiereVerification = false;

            return;
        }

        // Détecter les commandes réellement nouvelles
        const nouvellesCommandes = commandes.filter(
            commande => Number(commande.id) > dernierIdCommande
        );

        if (nouvellesCommandes.length > 0) {

            compteurNouvellesCommandes += nouvellesCommandes.length;

            dernierIdCommande = dernierIdActuel;

            document.getElementById("compteur-notifications").textContent =
                compteurNouvellesCommandes;

            const messageNotification = document.getElementById("message-notification");

messageNotification.textContent =
    compteurNouvellesCommandes === 1
        ? "1 nouvelle commande reçue !"
        : compteurNouvellesCommandes + " nouvelles commandes reçues !";
            // Actualiser les commandes et les statistiques
            await chargerCommandes();
            await chargerStatistiques();

        }

    } catch (erreur) {

        console.error("Erreur notifications :", erreur);

    }

}

// Vérification toutes les 10 secondes
verifierNouvellesCommandes();




setInterval(verifierNouvellesCommandes, 10000);

const boutonDeconnexion = document.getElementById("btn-deconnexion");

boutonDeconnexion.addEventListener("click", async () => {

    try {
        const reponse = await fetch("/api/admin/deconnexion", {
            method: "POST"
        });

        if (reponse.ok) {
            window.location.href = "/login.html";
        }

    } catch (erreur) {
        alert("Erreur lors de la déconnexion.");
    }

});

// Recherche des commandes
document.getElementById("recherche-commandes")
    .addEventListener("input", function () {

        pageCommandes = 1;
        chargerCommandes();

    });


// Filtrer les commandes par statut
document.getElementById("filtre-statut-commandes")
    .addEventListener("change", function () {

        pageCommandes = 1;
        chargerCommandes();

    });


// Page précédente
document.getElementById("btn-page-precedente")
    .addEventListener("click", function () {

        if (pageCommandes > 1) {
            pageCommandes--;
            chargerCommandes();
        }

    });


// Page suivante
document.getElementById("btn-page-suivante")
    .addEventListener("click", function () {

        pageCommandes++;
        chargerCommandes();

    });