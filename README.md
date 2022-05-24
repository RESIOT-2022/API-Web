<h1>Projet de mise en place d'API Web</h1>
<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary><h2 style="display: inline-block">Table des matières</h2></summary>
  <ol>
    <li><a href="#Présentation">Présentation</a></li>
    <li><a href="#Fonctionnalités">Fonctionnalités</a></li>
    <li><a href="#Installation et lancement du projet">Installation et lancement du projet</a></li>
    <li><a href="#Contact">Contact</a></li>
  </ol>
</details>

## Présentation
Lors du module RES-IoT dans le cadre de nos études en 2ème année d'école d'ingénieur en technologie de l'information, nous avons réalisé un projet en lien avec la spécialité Internet of Things. L'objectif du projet est de réaliser une API Rest afin de faire communiquer une interface web et une application qui est une maquette KNX dans le cadre du projet.

Plusieurs étapes permettent de mener à bien le projet :
1. Recherche de projets déjà existants
2. Développement Interface Web
3. Développement API Rest
4. Connexion Serveur-KNX
5. Fusion des communication Serveur-KNX et Serveur-Interface Web

## Fonctionnalités
Le répertoire est composé de plusieurs dossiers qui composent le projet :
1. server.js qui est le serveur du système
2. package.json qui est un fichier qui a été généré par la commande 
   ```sh
   npm init -y
   ```
3. Un dossier appelé 'front' donnant accès aux différentes ressources à savoir :
* images : donnant accès aux différentes images qui habille notre interface web.
* main.css : qui est le fichier principalement donnant le style de la page web.
* main.js : étant le script exécuté par l'interface web
* main.html : contenant le code source de la page web.
* unused_web_page_only.html : étant une version antérieure de la page web et donc inutile dans le bon fonctionnement du projet actuel.

## Installation et lancement du projet

1. Cloner le répertoire
   ```sh
   git clone https://github.com/RESIOT-2022/API-Web.git
   ```
   
2. Se positionner dans le répertoire API-Web

3. Installer les librairies suivantes à votre répertoire :
   ```sh
   npm install express
   npm install -D nodemon
   npm install knx
   npm install async-exit-hook
   ```

4. S'assurer de bien avoir appliquer les configurations suivantes à la maquette KNX : 
* Brancher 4 leds sur 4 prises secteurs de la maquette la première led étant configurée à l'adresse 0/0/1, la dernière étant configurée à l'adresse 0/0/4
* L'état des interrupteurs sur lesquels sont branchés les leds doivent être configurés aux adresses 0/1/1, 0/1/2, 0/1/3 et 0/1/4 respectivement.
* La maquette doit être composée d'au moins 4 boutons poussoirs étant configurés sur les qdresses 1/0/1 pour le lancement du chenillard 1/0/2 pour ralentir la vitesse du chenillard, 1/0/3 pour augmenter la vitesse du chenillard, 1/0/4 pour changer le motif du chenillard.

5. Lancer le projet grâce à la commande 
    ```sh
   npm run watch
    ```
    
6. Ouvrir l'interface web depuis votre navigateur avec l'url http://localhost:3000

## Contact
[@Corentin Grosos](https://www.linkedin.com/in/corentin-grosos-8092a719b/?originalSubdomain=fr)
[@Théo Delagarde](https://www.linkedin.com/in/th%C3%A9o-delagarde-029a35188/)
