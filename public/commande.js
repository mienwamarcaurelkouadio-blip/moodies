
/* =================================
   1. RÉCUPÉRER LE PANIER
================================= */

let panier = JSON.parse(localStorage.getItem("panier")) || [];


/* =================================
   2. RÉCUPÉRER LE FORMULAIRE
================================= */

const formulaire = document.getElementById("formulaire-commande");

/* =================================
   AFFICHER LE RÉCAPITULATIF
================================= */

// Frais de livraison provisoires
const FRAIS_LIVRAISON = 1000;

/* =================================
   2. GESTION DU MODE DE RÉCEPTION
================================= */

const modeReception = document.getElementById("mode-reception");

const blocAdresse = document.getElementById("bloc-adresse");

const adresseClient = document.getElementById("adresse-client");


modeReception.addEventListener("change", function() {

    if (modeReception.value === "Livraison à domicile") {

        blocAdresse.style.display = "block";

        adresseClient.required = true;

    } else {

        blocAdresse.style.display = "none";

        adresseClient.required = false;

        adresseClient.value = "";

    }

});


/* =================================
   AFFICHER LE RÉCAPITULATIF
================================= */


/* =================================
   AFFICHER LE RÉCAPITULATIF
================================= */

function afficherRecapitulatif() {

    const recap = document.getElementById("recapitulatif-commande");

    const sousTotalElement = document.getElementById("sous-total-commande");

    const fraisElement = document.getElementById("frais-livraison");

    const totalElement = document.getElementById("total-commande");

    let sousTotal = 0;

    recap.innerHTML = "";

    // Calculer le prix des produits
    panier.forEach(produit => {

        const montant = produit.prix * produit.quantite;

        sousTotal += montant;

        const ligne = document.createElement("p");

        ligne.textContent =
            `${produit.nom} x ${produit.quantite} : ${montant} FCFA`;

        recap.appendChild(ligne);

    });

    // Calculer les frais de livraison
    let frais = 0;

    if (modeReception.value === "Livraison à domicile") {
        frais = FRAIS_LIVRAISON;
    }

    // Calculer le montant final
    const totalFinal = sousTotal + frais;

    // Afficher les trois montants
    sousTotalElement.textContent = sousTotal + " FCFA";

    fraisElement.textContent = frais + " FCFA";

    totalElement.textContent = totalFinal + " FCFA";

}


// Actualiser les montants lorsque le client change de mode
modeReception.addEventListener("change", afficherRecapitulatif);


// Afficher le récapitulatif au chargement
afficherRecapitulatif();

/* =================================
   3. ENVOYER LA COMMANDE
================================= */


/* =================================
   ENVOYER LA COMMANDE SUR WHATSAPP
================================= */


formulaire.addEventListener("submit", async function(event) {

    event.preventDefault();

    if (panier.length === 0) {
        alert("Votre panier est vide !");
        window.location.href = "panier.html";
        return;
    }

    const nom = document.getElementById("nom-client").value.trim();
    const telephone = document.getElementById("telephone-client").value.trim();
    const adresse = adresseClient.value.trim();
    const mode = modeReception.value;
    const paiement = document.getElementById("mode-paiement").value;

    const donneesCommande = {
        nom,
        telephone,
        modeReception: mode,
        adresse,
        modePaiement: paiement,
        produits: panier.map(produit => ({
            id: produit.id,
            quantite: produit.quantite
        }))
    };

    try {

        const reponse = await fetch("/api/commandes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(donneesCommande)
        });

        const resultat = await reponse.json();

        if (!reponse.ok) {
            alert(resultat.message);
            return;
        }

        // Préparer le message WhatsApp
        
// Préparer le message WhatsApp




        localStorage.removeItem("panier");

alert(
    "Commande enregistrée avec succès !\n\n" +
    "Votre numéro de commande est : #" + resultat.commandeId +
    "\n\nVous allez être redirigé vers le suivi de votre commande."
);

window.location.href = "suivi-commande.html";


    } catch (erreur) {

        console.error(erreur);

        alert("Impossible d'enregistrer la commande. Réessayez.");

    }

});
