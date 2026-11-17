
/* =================================
   1. INITIALISATION DU PANIER
================================= */

let panier = JSON.parse(localStorage.getItem("panier")) || [];


/* =================================
   2. AJOUTER UN PRODUIT AU PANIER
================================= */

function ajouterAuPanier(id, nom, prix) {

    let produitExistant = panier.find(
        produit => produit.id === id
    );

    if (produitExistant) {

        produitExistant.quantite++;

    } else {

        panier.push({
            id: id,
            nom: nom,
            prix: prix,
            quantite: 1
        });

    }

    localStorage.setItem("panier", JSON.stringify(panier));

    alert(nom + " ajouté au panier !");

    console.log("Contenu du panier :", panier);
}



/* =================================
   3. RECUPERER LES PRODUITS DE MYSQL
================================= */

const listeProduits = document.getElementById("liste-produits");

async function chargerProduits() {

    if (!listeProduits) return;

    try {

        const reponse = await fetch("/api/produits");

        if (!reponse.ok) {
            throw new Error("Erreur lors de la récupération des produits");
        }

        const produits = await reponse.json();

        afficherProduits(produits);

    } catch (erreur) {

        console.error("Erreur :", erreur);

        listeProduits.innerHTML = `
            <p class="text-danger text-center">
                Impossible de charger les produits.
            </p>
        `;

    }

}


/* =================================
   4. AFFICHER LES PRODUITS
================================= */

function afficherProduits(produits) {

    listeProduits.innerHTML = "";

    produits.forEach(produit => {

        listeProduits.innerHTML += `

            <div class="col-md-4">

                <div class="card h-100 shadow-sm">

                    <img
                        src="${produit.image}"
                        class="card-img-top"
                        alt="${produit.nom}"
                    >

                    <div class="card-body text-center">

                        <h5 class="card-title">
                            ${produit.nom}
                        </h5>

                        <p class="card-text">
                            ${produit.description}
                        </p>

                        <h5 class="text-warning">
                            ${produit.prix} FCFA
                        </h5>

                        <button
                            class="btn btn-warning bouton-panier"
                            ${produit.stock <= 0 ? "disabled" : ""}
                        >
                            ${produit.stock <= 0 ? "Rupture de stock" : "Ajouter au panier"}
                        </button>

                    </div>

                </div>

            </div>

        `;

    });


    /* =================================
       5. ACTIVER LES BOUTONS
    ================================= */

    const boutons = listeProduits.querySelectorAll(".bouton-panier");

    boutons.forEach((bouton, index) => {

        bouton.addEventListener("click", () => {

            ajouterAuPanier(
    produits[index].id,
    produits[index].nom,
    produits[index].prix
);

        });

    });

}


/* =================================
   6. LANCER LE CHARGEMENT
================================= */

chargerProduits();
