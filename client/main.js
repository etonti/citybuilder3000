import * as THREE from 'three';
import { io } from 'socket.io-client';

// Configuration des bâtiments réalistes
const BUILDING_CONFIG = {
    house: {
        name: 'Maison',
        color: 0x8B4513,
        height: 3,
        width: 4,
        depth: 5,
        roofHeight: 2,
        cost: { money: 100, materials: 50 },
        production: { population: 10 }
    },
    road: {
        name: 'Route',
        color: 0x333333,
        height: 0.2,
        width: 4,
        depth: 4,
        cost: { money: 50, materials: 20 },
        production: {}
    },
    factory: {
        name: 'Usine',
        color: 0x666666,
        height: 6,
        width: 8,
        depth: 10,
        roofHeight: 1,
        cost: { money: 500, materials: 300 },
        production: { money: 5, materials: 2 }
    },
    powerplant: {
        name: 'Centrale Électrique',
        color: 0x444444,
        height: 8,
        width: 10,
        depth: 12,
        chimneyHeight: 15,
        cost: { money: 1000, materials: 800 },
        production: { money: 10 }
    },
    school: {
        name: 'École',
        color: 0x4682B4,
        height: 5,
        width: 12,
        depth: 8,
        roofHeight: 3,
        cost: { money: 300, materials: 200 },
        production: { money: 3, population: 5 }
    },
    apartment: {
        name: 'Appartement',
        color: 0x708090,
        height: 8,
        width: 6,
        depth: 8,
        floors: 4,
        cost: { money: 400, materials: 300 },
        production: { population: 25 }
    }
};

<<<<<<< HEAD
=======
// Gestionnaire de ressources
class ResourceManager {
    constructor(game) {
        this.game = game;
        this.productionInterval = 5000; // 5 secondes pour les tests
        this.buildingIncomeInterval = 300000; // 5 minutes pour le revenu des bâtiments
        this.lastProductionTime = Date.now();
        this.lastBuildingIncomeTime = Date.now();
        this.employedCitizens = 0;
        this.availableJobs = 0;
        this.totalPopulation = 0;
        this.maxPopulation = 0; // Population maximale possible
        this.buildingEfficiencies = new Map();
        
        this.init();
        
    }

    init() {
        this.calculateMaxPopulation();
        this.calculateEmployment();
        this.calculatePopulation();
    }

    // Calculer la population maximale basée sur les capacités des bâtiments
    calculateMaxPopulation() {
        this.maxPopulation = 0;
        this.game.buildingManager.buildings.forEach(building => {
            const config = BUILDING_CONFIG[building.type];
            if (config.residents) {
                this.maxPopulation += config.residents;
            }
        });
    }

    calculateEmployment() {
        this.availableJobs = 0;
        this.employedCitizens = 0;

        this.game.buildingManager.buildings.forEach(building => {
            const config = BUILDING_CONFIG[building.type];
            if (config.production.jobs) {
                this.availableJobs += config.production.jobs;
            }
        });

        // Limiter l'emploi à la population disponible
        this.employedCitizens = Math.min(this.totalPopulation, this.availableJobs);
    }

    calculatePopulation() {
        this.totalPopulation = 0;
        this.calculateMaxPopulation(); // Recalculer la capacité maximale
        
        // La population actuelle ne peut pas dépasser la capacité maximale
        let currentPopulation = 0;
        this.game.buildingManager.buildings.forEach(building => {
            const config = BUILDING_CONFIG[building.type];
            if (config.residents) {
                currentPopulation += config.residents;
            }
        });
        
        this.totalPopulation = Math.min(currentPopulation, this.maxPopulation);
        
        // Mettre à jour l'UI
        this.game.uiManager.resources.population = this.totalPopulation;
    }

    update() {
        const currentTime = Date.now();
        
        // Production continue toutes les 5 secondes (pour les tests)
        if (currentTime - this.lastProductionTime >= this.productionInterval) {
            this.produceContinuousResources();
            this.lastProductionTime = currentTime;
        }
        
        // Revenu des bâtiments toutes les 5 minutes
        if (currentTime - this.lastBuildingIncomeTime >= this.buildingIncomeInterval) {
            this.produceBuildingIncome();
            this.lastBuildingIncomeTime = currentTime;
        }
    }

    produceContinuousResources() {
        let totalProduction = {
            money: 0,
            materials: 0,
            energy: 0,
            water: 0,
            education: 0,
            happiness: 0,
            health: 0,
            safety: 0,
            research: 0
        };

        let totalConsumption = {
            energy: 0,
            water: 0,
            materials: 0
        };

        // Calculer la production et consommation de chaque bâtiment
        this.game.buildingManager.buildings.forEach(building => {
            const config = BUILDING_CONFIG[building.type];
            const production = config.production;
            const efficiency = this.getBuildingEfficiency(building.id);
            
            // Vérifier les limites d'employés pour les bâtiments industriels/commerciaux
            if (config.production.jobs) {
                const currentWorkers = building.workersAssigned || 0;
                const maxWorkers = config.production.jobs;
                const workerRatio = Math.min(currentWorkers / maxWorkers, 1);
                
                // Ajouter la production (avec efficacité et ratio de travailleurs)
                Object.keys(production).forEach(resource => {
                    if (typeof production[resource] === 'number' && resource !== 'jobs' && resource !== 'consumption') {
                        totalProduction[resource] += production[resource] * efficiency * workerRatio;
                    }
                });

                // Gérer la consommation (réduite si pas assez de travailleurs)
                if (production.consumption) {
                    Object.keys(production.consumption).forEach(resource => {
                        totalConsumption[resource] += production.consumption[resource] * efficiency * workerRatio;
                    });
                }
            } else {
                // Pour les bâtiments sans employés (résidentiels, etc.)
                Object.keys(production).forEach(resource => {
                    if (typeof production[resource] === 'number' && resource !== 'jobs' && resource !== 'consumption') {
                        totalProduction[resource] += production[resource] * efficiency;
                    }
                });

                if (production.consumption) {
                    Object.keys(production.consumption).forEach(resource => {
                        totalConsumption[resource] += production.consumption[resource] * efficiency;
                    });
                }
            }
        });

        // Revenu des emplois (basé sur le taux d'emploi réel)
        const employmentRate = this.availableJobs > 0 ? this.employedCitizens / this.availableJobs : 0;
        const incomeFromJobs = this.employedCitizens * 2; // 2$ par employé
        totalProduction.money += incomeFromJobs;

        // Appliquer les bonus/malus
        const employmentBonus = employmentRate > 0.8 ? 1.2 : employmentRate > 0.5 ? 1.1 : 1.0;
        totalProduction.money *= employmentBonus;
        totalProduction.materials *= employmentBonus;

        // Calculer les ressources nettes
        const netResources = {
            money: totalProduction.money,
            materials: totalProduction.materials,
            energy: totalProduction.energy - totalConsumption.energy,
            water: totalProduction.water - totalConsumption.water,
            education: totalProduction.education,
            happiness: totalProduction.happiness,
            health: totalProduction.health,
            safety: totalProduction.safety,
            research: totalProduction.research
        };

        // Mettre à jour les ressources dans l'UI
        this.game.uiManager.updateResources(netResources);

        // Mettre à jour les statistiques
        this.calculateEmployment();
        this.calculatePopulation();
        this.updateStatisticsDisplay();
    }

    produceBuildingIncome() {
        let totalIncome = {
            money: 0,
            materials: 0
        };

        // Chaque bâtiment rapporte 10% de son coût de construction toutes les 5 minutes
        this.game.buildingManager.buildings.forEach(building => {
            const config = BUILDING_CONFIG[building.type];
            const efficiency = this.getBuildingEfficiency(building.id);
            
            // 10% du coût de construction toutes les 5 minutes
            const buildingIncome = {
                money: config.cost.money * 0.1 * efficiency,
                materials: config.cost.materials * 0.1 * efficiency
            };
            
            totalIncome.money += buildingIncome.money;
            totalIncome.materials += buildingIncome.materials;
            
            // Afficher un message pour les revenus importants
            if (buildingIncome.money > 50) {
                this.game.uiManager.showMessage(
                    `${config.name} rapporte ${Math.round(buildingIncome.money)}💰 et ${Math.round(buildingIncome.materials)}🔧`,
                    'success'
                );
            }
        });

        // Appliquer le revenu
        this.game.uiManager.updateResources(totalIncome);
        
        if (totalIncome.money > 0 || totalIncome.materials > 0) {
            this.game.uiManager.showMessage(
                `Revenus des bâtiments: +${Math.round(totalIncome.money)}💰 +${Math.round(totalIncome.materials)}🔧`,
                'info'
            );
        }
    }

    getBuildingEfficiency(buildingId) {
        if (this.buildingEfficiencies.has(buildingId)) {
            return this.buildingEfficiencies.get(buildingId);
        }

        const building = this.game.buildingManager.buildings.get(buildingId);
        if (!building) return 0;

        const config = BUILDING_CONFIG[building.type];
        let efficiency = 1.0;

        // Réduire l'efficacité si manque de ressources
        const resources = this.game.uiManager.resources;
        if (config.production.consumption) {
            if (config.production.consumption.energy && resources.energy < 10) efficiency *= 0.7;
            if (config.production.consumption.water && resources.water < 10) efficiency *= 0.7;
            if (config.production.consumption.materials && resources.materials < 20) efficiency *= 0.8;
        }

        // Bonus d'efficacité pour les bâtiments avec employés
        if (config.production.jobs) {
            const currentWorkers = building.workersAssigned || 0;
            const maxWorkers = config.production.jobs;
            const employmentRate = maxWorkers > 0 ? currentWorkers / maxWorkers : 1;
            efficiency *= employmentRate > 0.7 ? 1.2 : employmentRate > 0.4 ? 1.0 : 0.7;
        }

        this.buildingEfficiencies.set(buildingId, efficiency);
        return efficiency;
    }

    updateStatisticsDisplay() {
        const statsPanel = document.getElementById('statistics-panel');
        if (!statsPanel) return;

        const employmentRate = this.availableJobs > 0 ? 
            Math.round((this.employedCitizens / this.availableJobs) * 100) : 0;
        
        const totalBuildings = this.game.buildingManager.buildings.size;
        const totalRevenue = this.calculateTotalRevenue();

        statsPanel.innerHTML = `
            <h4 style="margin: 0 0 12px 0; border-bottom: 1px solid #4a5568; padding-bottom: 8px;">📊 Statistiques de la Ville</h4>
            <div class="stat-item" style="display: flex; justify-content: space-between; margin: 6px 0;">
                <span>👥 Population:</span>
                <span style="font-weight: bold;">${this.totalPopulation}/${this.maxPopulation}</span>
            </div>
            <div class="stat-item" style="display: flex; justify-content: space-between; margin: 6px 0;">
                <span>💼 Emplois:</span>
                <span style="font-weight: bold;">${this.employedCitizens}/${this.availableJobs}</span>
            </div>
            <div class="stat-item" style="display: flex; justify-content: space-between; margin: 6px 0;">
                <span>📈 Taux d'emploi:</span>
                <span style="font-weight: bold; color: ${employmentRate > 80 ? '#4cd964' : employmentRate > 50 ? '#ffd93d' : '#ff6b6b'}">
                    ${employmentRate}%
                </span>
            </div>
            <div class="stat-item" style="display: flex; justify-content: space-between; margin: 6px 0;">
                <span>🏢 Bâtiments:</span>
                <span style="font-weight: bold;">${totalBuildings}</span>
            </div>
            <div class="stat-item" style="display: flex; justify-content: space-between; margin: 6px 0;">
                <span>💰 Revenu/h:</span>
                <span style="font-weight: bold; color: #4cd964">${Math.round(totalRevenue.money * 12)}💰</span>
            </div>
            <div class="stat-item" style="display: flex; justify-content: space-between; margin: 6px 0;">
                <span>🔧 Production/h:</span>
                <span style="font-weight: bold; color: #4cd964">${Math.round(totalRevenue.materials * 12)}🔧</span>
            </div>
            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #4a5568; font-size: 12px; opacity: 0.8;">
                ⏰ Revenus: 10% du coût/5min<br>
                💰 Remboursement: 50% à la suppression
            </div>
        `;
    }

    calculateTotalRevenue() {
        let totalMoney = 0;
        let totalMaterials = 0;

        this.game.buildingManager.buildings.forEach(building => {
            const config = BUILDING_CONFIG[building.type];
            const efficiency = this.getBuildingEfficiency(building.id);
            
            // Revenu de base du bâtiment
            if (config.production.money) {
                totalMoney += config.production.money * efficiency;
            }
            if (config.production.materials) {
                totalMaterials += config.production.materials * efficiency;
            }
            
            // Revenu des emplois (approximation)
            if (config.production.jobs) {
                const currentWorkers = building.workersAssigned || 0;
                totalMoney += currentWorkers * 0.5 * efficiency;
            }
            
            // Revenu du coût de construction (10% toutes les 5 minutes = 12 fois par heure)
            totalMoney += (config.cost.money * 0.1) * 12 * efficiency;
            totalMaterials += (config.cost.materials * 0.1) * 12 * efficiency;
        });

        return {
            money: totalMoney,
            materials: totalMaterials
        };
    }

    // Méthode pour rembourser 50% du coût lors de la suppression
    refundBuilding(buildingType) {
        const config = BUILDING_CONFIG[buildingType];
        const refund = {
            money: Math.round(config.cost.money * 0.5),
            materials: Math.round(config.cost.materials * 0.5)
        };
        
        this.game.uiManager.updateResources(refund);
        this.game.uiManager.showMessage(
            `Remboursement: +${refund.money}💰 +${refund.materials}🔧`,
            'success'
        );
        
        return refund;
    }

    canBuild(buildingType) {
        const config = BUILDING_CONFIG[buildingType];
        const resources = this.game.uiManager.resources;
        
        return resources.money >= config.cost.money && 
               resources.materials >= config.cost.materials;
    }

    // Vérifier si on peut ajouter des habitants (pour les bâtiments résidentiels)
    canAddResidents(additionalResidents) {
        return (this.totalPopulation + additionalResidents) <= this.maxPopulation;
    }
}

// Textures et matériaux améliorés
class TextureManager {
    constructor() {
        this.textures = new Map();
        this.materials = new Map();
        this.init();
    }

    init() {
        this.createTextures();
    }

    createTextures() {
        // Créer des textures procédurales de base
        this.createBrickTexture();
        this.createConcreteTexture();
        this.createGlassTexture();
        this.createGrassTexture();
        this.createAsphaltTexture();
        this.createIndustrialTexture();
    }

    createBrickTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');

        // Fond brique
        context.fillStyle = '#8B4513';
        context.fillRect(0, 0, 256, 256);

        // Motif de briques
        context.strokeStyle = '#A0522D';
        context.lineWidth = 2;

        for (let y = 0; y < 256; y += 32) {
            for (let x = 0; x < 256; x += 64) {
                context.strokeRect(x, y, 60, 28);
            }
            for (let x = 32; x < 256; x += 64) {
                context.strokeRect(x, y + 16, 60, 28);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        this.textures.set('brick', texture);
    }

    createConcreteTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');

        context.fillStyle = '#708090';
        context.fillRect(0, 0, 256, 256);

        // Ajouter du bruit pour la texture
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const brightness = Math.random() * 50;
            context.fillStyle = `rgba(255, 255, 255, ${brightness / 255})`;
            context.fillRect(x, y, 1, 1);
        }

        const texture = new THREE.CanvasTexture(canvas);
        this.textures.set('concrete', texture);
    }

    createGlassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');

        // Verre bleu transparent
        context.fillStyle = 'rgba(135, 206, 235, 0.3)';
        context.fillRect(0, 0, 128, 128);

        // Réflexions
        context.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            context.fillRect(x, y, 20, 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        this.textures.set('glass', texture);
    }

    createGrassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');

        // Herbe verte
        context.fillStyle = '#228B22';
        context.fillRect(0, 0, 256, 256);

        // Variations de vert
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const greenVariation = Math.random() * 50;
            context.fillStyle = `rgb(34, ${139 + greenVariation}, 34)`;
            context.fillRect(x, y, 2, 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        this.textures.set('grass', texture);
    }

    createAsphaltTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');

        // Asphalte gris
        context.fillStyle = '#333333';
        context.fillRect(0, 0, 256, 256);

        // Texture granuleuse
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const brightness = Math.random() * 30;
            context.fillStyle = `rgb(${51 + brightness}, ${51 + brightness}, ${51 + brightness})`;
            context.fillRect(x, y, 1, 1);
        }

        const texture = new THREE.CanvasTexture(canvas);
        this.textures.set('asphalt', texture);
    }

    createIndustrialTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');

        // Métal industriel
        context.fillStyle = '#666666';
        context.fillRect(0, 0, 256, 256);

        // Panneaux métalliques
        context.strokeStyle = '#555555';
        context.lineWidth = 2;
        for (let y = 0; y < 256; y += 32) {
            for (let x = 0; x < 256; x += 32) {
                context.strokeRect(x, y, 30, 30);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        this.textures.set('industrial', texture);
    }

    getMaterial(type, color = null) {
        const key = `${type}_${color}`;
        if (this.materials.has(key)) {
            return this.materials.get(key);
        }

        let material;
        switch (type) {
            case 'brick':
                material = new THREE.MeshLambertMaterial({ 
                    map: this.textures.get('brick'),
                    color: color || 0x8B4513
                });
                break;
            case 'concrete':
                material = new THREE.MeshLambertMaterial({ 
                    map: this.textures.get('concrete'),
                    color: color || 0x708090
                });
                break;
            case 'glass':
                material = new THREE.MeshLambertMaterial({ 
                    map: this.textures.get('glass'),
                    transparent: true,
                    opacity: 0.6,
                    color: color || 0x87CEEB
                });
                break;
            case 'grass':
                material = new THREE.MeshLambertMaterial({ 
                    map: this.textures.get('grass'),
                    color: color || 0x228B22
                });
                break;
            case 'asphalt':
                material = new THREE.MeshLambertMaterial({ 
                    map: this.textures.get('asphalt'),
                    color: color || 0x333333
                });
                break;
            case 'industrial':
                material = new THREE.MeshLambertMaterial({ 
                    map: this.textures.get('industrial'),
                    color: color || 0x666666
                });
                break;
            default:
                material = new THREE.MeshLambertMaterial({ color: color || 0x888888 });
        }

        this.materials.set(key, material);
        return material;
    }
}

// Gestionnaire d'erreurs
class ErrorManager {
    constructor() {
        this.errors = [];
    }
    
    logError(context, error, severity = 'warning') {
        const errorData = {
            id: Date.now(),
            context,
            message: error.message,
            stack: error.stack,
            severity,
            timestamp: new Date().toISOString()
        };
        
        this.errors.push(errorData);
        console.error(`[${severity.toUpperCase()}] ${context}:`, error);
        
        if (this.errors.length > 100) {
            this.errors = this.errors.slice(-100);
        }
        
        return errorData;
    }
    
    showErrorToUser(message, type = 'error') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            background: ${type === 'error' ? '#ff6b6b' : type === 'success' ? '#4cd964' : '#8b9dff'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            font-weight: 500;
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Gestionnaire de sauvegarde
class SaveManager {
    constructor(game) {
        this.game = game;
        this.autoSaveInterval = null;
    }
    
    saveGame(slotName = 'autosave') {
        try {
            const saveData = {
                timestamp: Date.now(),
                buildings: Array.from(this.game.buildingManager.buildings.values()).map(building => ({
                    type: building.type,
                    x: building.x,
                    z: building.z,
                    playerId: building.playerId
                })),
                resources: this.game.uiManager.resources,
                camera: {
                    position: [this.game.camera.position.x, this.game.camera.position.y, this.game.camera.position.z],
                    target: [this.game.cameraController.target.x, this.game.cameraController.target.y, this.game.cameraController.target.z]
                }
            };
            
            localStorage.setItem(`citybuilder_${slotName}`, JSON.stringify(saveData));
            console.log(`Jeu sauvegardé: ${slotName}`);
            return saveData;
        } catch (error) {
            this.game.errorManager.logError('SaveManager.saveGame', error, 'error');
            return null;
        }
    }
    
    loadGame(slotName = 'autosave') {
        try {
            const saveData = JSON.parse(localStorage.getItem(`citybuilder_${slotName}`));
            if (saveData) {
                this.game.loadGameState(saveData);
                
                if (saveData.camera) {
                    this.game.camera.position.fromArray(saveData.camera.position);
                    this.game.cameraController.target.fromArray(saveData.camera.target);
                    this.game.cameraController.updateCameraPosition();
                }
                
                console.log(`Jeu chargé: ${slotName}`);
                return true;
            }
            return false;
        } catch (error) {
            this.game.errorManager.logError('SaveManager.loadGame', error, 'error');
            return false;
        }
    }
    
    startAutoSave(interval = 60000) {
        this.autoSaveInterval = setInterval(() => {
            this.saveGame('autosave');
        }, interval);
    }
    
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
    
    getSaveSlots() {
        const slots = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('citybuilder_')) {
                try {
                    const saveData = JSON.parse(localStorage.getItem(key));
                    slots.push({
                        name: key.replace('citybuilder_', ''),
                        timestamp: saveData.timestamp,
                        buildingCount: saveData.buildings ? saveData.buildings.length : 0
                    });
                } catch (e) {
                    // Ignorer les entrées corrompues
                }
            }
        }
        return slots.sort((a, b) => b.timestamp - a.timestamp);
    }
}

// Gestionnaire de quêtes
class QuestManager {
    constructor(game) {
        this.game = game;
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        this.setupDefaultQuests();
    }
    
    setupDefaultQuests() {
        this.addQuest({
            id: 'first_building',
            title: 'Première construction',
            description: 'Construisez votre premier bâtiment',
            objective: { type: 'build', buildingType: 'any', count: 1 },
            reward: { money: 500, materials: 200 },
            onComplete: () => this.game.uiManager.showMessage('Félicitations pour votre premier bâtiment!', 'success')
        });
        
        this.addQuest({
            id: 'small_town',
            title: 'Petite ville',
            description: 'Ayez une population de 50 habitants',
            objective: { type: 'population', count: 50 },
            reward: { money: 1000, materials: 500 },
            onComplete: () => this.game.uiManager.showMessage('Votre ville grandit!', 'success')
        });

        this.addQuest({
            id: 'diverse_city',
            title: 'Ville diversifiée',
            description: 'Construisez au moins un bâtiment de chaque catégorie',
            objective: { type: 'categories', categories: ['residential', 'commercial', 'industrial', 'education', 'infrastructure'], count: 1 },
            reward: { money: 2000, materials: 1000, happiness: 20 },
            onComplete: () => this.game.uiManager.showMessage('Votre ville est maintenant diversifiée!', 'success')
        });
    }
    
    addQuest(quest) {
        this.activeQuests.set(quest.id, {
            ...quest,
            progress: 0,
            completed: false
        });
        this.updateQuestDisplay();
    }
    
    updateQuestProgress(type, data) {
        for (const [questId, quest] of this.activeQuests) {
            if (quest.completed) continue;
            
            let updated = false;
            
            if (quest.objective.type === type) {
                switch (type) {
                    case 'build':
                        if (quest.objective.buildingType === 'any' || data.buildingType === quest.objective.buildingType) {
                            quest.progress++;
                            updated = true;
                        }
                        break;
                    case 'population':
                        quest.progress = this.game.resourceManager.totalPopulation;
                        updated = true;
                        break;
                    case 'categories':
                        const builtCategories = new Set();
                        this.game.buildingManager.buildings.forEach(building => {
                            const config = BUILDING_CONFIG[building.type];
                            builtCategories.add(config.category);
                        });
                        
                        quest.progress = Array.from(builtCategories).length;
                        updated = true;
                        break;
                }
                
                if (updated && quest.progress >= quest.objective.count) {
                    this.completeQuest(questId);
                }
            }
        }
        this.updateQuestDisplay();
    }
    
    completeQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (quest && !quest.completed) {
            quest.completed = true;
            this.completedQuests.add(questId);
            
            this.game.uiManager.updateResources(quest.reward);
            
            if (quest.onComplete) {
                quest.onComplete();
            }
            
            this.game.uiManager.showMessage(`Quête terminée: ${quest.title} (+${quest.reward.money}💰 +${quest.reward.materials}🔧)`, 'success');
            this.updateQuestDisplay();
        }
    }
    
    updateQuestDisplay() {
        const questPanel = document.getElementById('quest-panel');
        if (!questPanel) return;
        
        let html = '<h3>🎯 Quêtes</h3>';
        
        if (this.activeQuests.size === 0) {
            html += '<p>Aucune quête active</p>';
        } else {
            html += '<div class="quests-list">';
            this.activeQuests.forEach(quest => {
                const progress = Math.min(quest.progress, quest.objective.count);
                const percentage = (progress / quest.objective.count) * 100;
                
                html += `
                    <div class="quest-item ${quest.completed ? 'completed' : ''}">
                        <div class="quest-header">
                            <strong>${quest.title}</strong>
                            ${quest.completed ? '<span class="quest-completed">✓ Terminé</span>' : ''}
                        </div>
                        <div class="quest-description">${quest.description}</div>
                        ${!quest.completed ? `
                            <div class="quest-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${percentage}%"></div>
                                </div>
                                <span class="progress-text">${progress}/${quest.objective.count}</span>
                            </div>
                        ` : ''}
                        ${quest.completed ? `
                            <div class="quest-reward">
                                Récompense: +${quest.reward.money}💰 +${quest.reward.materials}🔧
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            html += '</div>';
        }
        
        questPanel.innerHTML = html;
    }
}

// Algorithme A* optimisé avec cache
class OptimizedAStar {
    constructor(gridWidth, gridHeight) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.cache = new Map();
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    isValidCell(x, y, grid) {
        return x >= 0 && x < this.gridWidth && 
               y >= 0 && y < this.gridHeight && 
               grid[y][x] === 0;
    }

    getNeighbors(node, grid) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 },  { x: 1, y: 0 },   { x: 0, y: 1 },   { x: -1, y: 0 },
            { x: 1, y: -1 },  { x: 1, y: 1 },   { x: -1, y: 1 },  { x: -1, y: -1 }
        ];

        for (const dir of directions) {
            const newX = node.x + dir.x;
            const newY = node.y + dir.y;

            if (this.isValidCell(newX, newY, grid)) {
                if (Math.abs(dir.x) === 1 && Math.abs(dir.y) === 1) {
                    if (grid[node.y][newX] !== 0 || grid[newY][node.x] !== 0) {
                        continue;
                    }
                }
                neighbors.push({ x: newX, y: newY });
            }
        }

        return neighbors;
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        while (cameFrom.has(this.hashCell(current))) {
            current = cameFrom.get(this.hashCell(current));
            path.unshift(current);
        }
        return path;
    }

    hashCell(cell) {
        return `${cell.x},${cell.y}`;
    }

    getCacheKey(start, goal) {
        return `${start.x},${start.y}-${goal.x},${goal.y}`;
    }

    findPath(start, goal, grid) {
        const cacheKey = this.getCacheKey(start, goal);
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const openSet = [start];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        gScore.set(this.hashCell(start), 0);
        fScore.set(this.hashCell(start), this.heuristic(start, goal));

        while (openSet.length > 0) {
            let current = openSet[0];
            let currentIndex = 0;

            for (let i = 1; i < openSet.length; i++) {
                const node = openSet[i];
                const currentFScore = fScore.get(this.hashCell(current)) || Infinity;
                const nodeFScore = fScore.get(this.hashCell(node)) || Infinity;
                
                if (nodeFScore < currentFScore) {
                    current = node;
                    currentIndex = i;
                }
            }

            if (current.x === goal.x && current.y === goal.y) {
                const path = this.reconstructPath(cameFrom, current);
                this.cache.set(cacheKey, path);
                return path;
            }

            openSet.splice(currentIndex, 1);

            const neighbors = this.getNeighbors(current, grid);
            for (const neighbor of neighbors) {
                const isDiagonal = Math.abs(neighbor.x - current.x) === 1 && 
                                 Math.abs(neighbor.y - current.y) === 1;
                const moveCost = isDiagonal ? 1.4 : 1;

                const tentativeG = (gScore.get(this.hashCell(current)) || 0) + moveCost;

                if (tentativeG < (gScore.get(this.hashCell(neighbor)) || Infinity)) {
                    cameFrom.set(this.hashCell(neighbor), current);
                    gScore.set(this.hashCell(neighbor), tentativeG);
                    fScore.set(this.hashCell(neighbor), tentativeG + this.heuristic(neighbor, goal));

                    if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        this.cache.set(cacheKey, null);
        return null;
    }

    invalidateCache() {
        this.cache.clear();
    }
}

class EntityManager {
    constructor(scene, gridSystem) {
        this.scene = scene;
        this.gridSystem = gridSystem;
        this.entities = new Map();
        this.pathfinding = new OptimizedAStar(100, 100);
        this.nextEntityId = 1;
        this.pedestrianZones = new Set();
    }

    createEntity(type = 'person', startX, startZ) {
        const entityId = `entity_${this.nextEntityId++}`;
        const worldPos = this.gridSystem.gridToWorld(startX, startZ);
        
        let mesh;
        if (type === 'person') {
            // Personnage plus détaillé
            const bodyGroup = new THREE.Group();
            
            // Corps
            const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
            const bodyMaterial = new THREE.MeshLambertMaterial({ 
                color: Math.random() * 0xffffff 
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 0.4;
            bodyGroup.add(body);
            
            // Tête
            const headGeometry = new THREE.SphereGeometry(0.12, 8, 8);
            const headMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFD700 
            });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 0.9;
            bodyGroup.add(head);
            
            // Bras
            const armGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6);
            const armMaterial = new THREE.MeshLambertMaterial({ 
                color: bodyMaterial.color 
            });
            
            const leftArm = new THREE.Mesh(armGeometry, armMaterial);
            leftArm.position.set(-0.2, 0.4, 0);
            leftArm.rotation.z = Math.PI / 4;
            bodyGroup.add(leftArm);
            
            const rightArm = new THREE.Mesh(armGeometry, armMaterial);
            rightArm.position.set(0.2, 0.4, 0);
            rightArm.rotation.z = -Math.PI / 4;
            bodyGroup.add(rightArm);

            mesh = bodyGroup;
        } else if (type === 'vehicle') {
            const bodyGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.2);
            const bodyMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFF0000 
            });
            mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        }

        mesh.position.set(worldPos.x, 0.5, worldPos.z);
        mesh.castShadow = true;
        this.scene.add(mesh);

        const entity = {
            id: entityId,
            type: type,
            mesh: mesh,
            gridPosition: { x: startX, z: startZ },
            path: [],
            currentTargetIndex: 0,
            speed: type === 'person' ? 0.015 : 0.04,
            state: 'idle',
            color: type === 'person' ? bodyMaterial.color.getHex() : 0xFF0000,
            destination: null,
            isWorking: false
        };

        this.entities.set(entityId, entity);
        return entityId;
    }

    moveEntity(entityId, targetX, targetZ) {
        const entity = this.entities.get(entityId);
        if (!entity) return false;

        const start = { x: entity.gridPosition.x, y: entity.gridPosition.z };
        const goal = { x: targetX, y: targetZ };

        const grid = this.createNavigationGrid();
        const path = this.pathfinding.findPath(start, goal, grid);
        
        if (path && path.length > 0) {
            entity.path = path;
            entity.currentTargetIndex = 0;
            entity.state = 'moving';
            entity.destination = { x: targetX, z: targetZ };
            return true;
        } else {
            console.warn(`Aucun chemin trouvé pour l'entité ${entityId}`);
            return false;
        }
    }

    createNavigationGrid() {
        const gridSize = 100;
        const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(1)); // 1 = bloqué par défaut

        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                const building = this.gridSystem.getBuildingAt(x, z);
                if (building) {
                    const config = BUILDING_CONFIG[building.type];
                    // Les personnages peuvent marcher sur les routes, trottoirs et parcs
                    if (config.production.walkable || config.production.pedestrian || config.production.infrastructure) {
                        grid[z][x] = 0; // 0 = navigable
                    } else {
                        grid[z][x] = 1; // 1 = bloqué
                    }
                } else {
                    // Cases vides = navigables
                    grid[z][x] = 0;
                }
            }
        }

        return grid;
    }

    update() {
        for (const [entityId, entity] of this.entities) {
            if (entity.state === 'moving' && entity.path.length > 0) {
                this.updateEntityMovement(entity);
            } else if (entity.state === 'idle') {
                this.assignRandomDestination(entity);
            }
        }
    }

    assignRandomDestination(entity) {
        // 20% de chance de se déplacer aléatoirement
        if (Math.random() < 0.002) {
            const gridSize = 20;
            const targetX = Math.floor(Math.random() * gridSize) - gridSize/2;
            const targetZ = Math.floor(Math.random() * gridSize) - gridSize/2;
            
            this.moveEntity(entity.id, targetX, targetZ);
        }
    }

    updateEntityMovement(entity) {
        if (entity.currentTargetIndex >= entity.path.length) {
            entity.state = 'arrived';
            
            // Si c'est un travailleur, le faire "travailler" pendant un moment
            if (entity.isWorking) {
                entity.state = 'working';
                setTimeout(() => {
                    entity.state = 'idle';
                    entity.isWorking = false;
                }, 5000); // Travaille pendant 5 secondes
            }
            return;
        }

        const targetNode = entity.path[entity.currentTargetIndex];
        const targetWorldPos = this.gridSystem.gridToWorld(targetNode.x, targetNode.y);
        const currentPos = entity.mesh.position;

        const dx = targetWorldPos.x - currentPos.x;
        const dz = targetWorldPos.z - currentPos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < entity.speed) {
            entity.currentTargetIndex++;
            entity.gridPosition = { x: targetNode.x, z: targetNode.y };
            
            if (entity.currentTargetIndex >= entity.path.length) {
                entity.state = 'arrived';
                console.log(`Entité ${entity.id} arrivée à destination`);
            }
        } else {
            const moveX = (dx / distance) * entity.speed;
            const moveZ = (dz / distance) * entity.speed;

            entity.mesh.position.x += moveX;
            entity.mesh.position.z += moveZ;

            if (distance > 0.1) {
                entity.mesh.lookAt(
                    currentPos.x + dx,
                    currentPos.y,
                    currentPos.z + dz
                );
            }

            if (entity.type === 'person') {
                this.animateWalking(entity, distance);
            }
        }
    }

    animateWalking(entity, distance) {
        const time = Date.now() * 0.01;
        const bounce = Math.sin(time * 10) * 0.05;
        entity.mesh.position.y = 0.5 + bounce;
        
        // Animation des bras
        if (entity.mesh.children.length > 2) {
            const leftArm = entity.mesh.children[2];
            const rightArm = entity.mesh.children[3];
            leftArm.rotation.z = Math.PI / 4 + Math.sin(time * 10) * 0.3;
            rightArm.rotation.z = -Math.PI / 4 + Math.sin(time * 10 + Math.PI) * 0.3;
        }
    }

    removeEntity(entityId) {
        const entity = this.entities.get(entityId);
        if (entity) {
            this.scene.remove(entity.mesh);
            this.entities.delete(entityId);
        }
    }

    getEntityPosition(entityId) {
        const entity = this.entities.get(entityId);
        return entity ? entity.gridPosition : null;
    }

    getEntityState(entityId) {
        const entity = this.entities.get(entityId);
        return entity ? entity.state : null;
    }

    createEntityGroup(count, startArea) {
        const entities = [];
        for (let i = 0; i < count; i++) {
            const x = startArea.x + Math.floor(Math.random() * startArea.width);
            const z = startArea.z + Math.floor(Math.random() * startArea.depth);
            const entityId = this.createEntity('person', x, z);
            entities.push(entityId);
        }
        return entities;
    }

    assignWorkersToBuildings(buildingManager) {
        let workersAssigned = 0;
        const availableWorkers = Array.from(this.entities.values())
            .filter(e => e.type === 'person' && !e.isWorking && e.state === 'idle');
        
        // Réinitialiser le compteur de travailleurs pour tous les bâtiments
        buildingManager.buildings.forEach(building => {
            building.workersAssigned = 0;
        });
        
        // Assigner les travailleurs en respectant les limites de chaque bâtiment
        buildingManager.buildings.forEach(building => {
            const config = BUILDING_CONFIG[building.type];
            if (config.production.jobs && building.workersAssigned < config.production.jobs) {
                const workersNeeded = config.production.jobs - building.workersAssigned;
                const workersToAssign = availableWorkers.splice(0, workersNeeded);
                
                workersToAssign.forEach(worker => {
                    worker.isWorking = true;
                    this.moveEntity(worker.id, building.x, building.z);
                    building.workersAssigned = (building.workersAssigned || 0) + 1;
                    workersAssigned++;
                });
            }
        });
        
        return workersAssigned;
    }
    
}

>>>>>>> 21b6ef2 (nouveau test)
class AdvancedCameraController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        this.state = 'NONE';
        this.previousMousePosition = { x: 0, y: 0 };
        
        this.rotateSpeed = 0.005;
        this.panSpeed = 0.01;
        this.zoomSpeed = 0.001;
        
        this.target = new THREE.Vector3(0, 0, 0);
        this.distance = 50;
        this.phi = Math.PI / 4;
        this.theta = Math.PI / 3;
        
        this.minDistance = 10;
        this.maxDistance = 200;
        this.minTheta = 0.1;
        this.maxTheta = Math.PI / 2 - 0.1;
        
        this.initEventListeners();
        this.updateCameraPosition();
    }

    initEventListeners() {
        this.domElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
            
            if (e.button === 0) {
                this.state = 'ROTATE';
                this.domElement.style.cursor = 'grabbing';
            } else if (e.button === 2) {
                this.state = 'PAN';
                this.domElement.style.cursor = 'move';
            }
            
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.domElement.addEventListener('mousemove', (e) => {
            e.preventDefault();
            
            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;

            if (this.state === 'ROTATE') {
                this.handleRotation(deltaX, deltaY);
            } else if (this.state === 'PAN') {
                this.handlePan(deltaX, deltaY);
            }

            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.domElement.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.state = 'NONE';
            this.domElement.style.cursor = 'grab';
        });

        this.domElement.addEventListener('mouseleave', () => {
            this.state = 'NONE';
            this.domElement.style.cursor = 'grab';
        });

        this.domElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        this.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleZoom(e);
        });

        this.domElement.style.cursor = 'grab';
    }

    handleRotation(deltaX, deltaY) {
        this.phi -= deltaX * this.rotateSpeed;
        this.theta -= deltaY * this.rotateSpeed;
        
        this.theta = Math.max(this.minTheta, Math.min(this.maxTheta, this.theta));
        this.updateCameraPosition();
    }

    handlePan(deltaX, deltaY) {
        const right = new THREE.Vector3(
            Math.cos(this.phi),
            0,
            Math.sin(this.phi)
        ).normalize();
        
        const forward = new THREE.Vector3(
            Math.sin(this.phi),
            0,
            -Math.cos(this.phi)
        ).normalize();

        this.target.add(right.multiplyScalar(-deltaX * this.panSpeed));
        this.target.add(forward.multiplyScalar(-deltaY * this.panSpeed));
        
        const limit = 100;
        this.target.x = Math.max(-limit, Math.min(limit, this.target.x));
        this.target.z = Math.max(-limit, Math.min(limit, this.target.z));
        
        this.updateCameraPosition();
    }

    handleZoom(e) {
        const zoomAmount = e.deltaY * this.zoomSpeed;
        this.distance += this.distance * zoomAmount;
        this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
        this.updateCameraPosition();
    }

    updateCameraPosition() {
        const x = this.distance * Math.sin(this.theta) * Math.cos(this.phi);
        const y = this.distance * Math.cos(this.theta);
        const z = this.distance * Math.sin(this.theta) * Math.sin(this.phi);
        
        this.camera.position.set(
            this.target.x + x,
            this.target.y + y,
            this.target.z + z
        );
        
        this.camera.lookAt(this.target);
    }

    update() {
        // Pour les animations continues
    }
}

class GridSystem {
    constructor(size, cellSize) {
        this.size = size;
        this.cellSize = cellSize;
        this.occupiedCells = new Map();
        this.snapToGrid = true;
    }

    worldToGrid(worldX, worldZ) {
        if (this.snapToGrid) {
            const gridX = Math.round(worldX / this.cellSize);
            const gridZ = Math.round(worldZ / this.cellSize);
            return { x: gridX, z: gridZ };
        } else {
            return { x: worldX, z: worldZ };
        }
    }

    gridToWorld(gridX, gridZ) {
        if (this.snapToGrid) {
            return { 
                x: gridX * this.cellSize, 
                z: gridZ * this.cellSize 
            };
        } else {
            return { x: gridX, z: gridZ };
        }
    }

    isCellOccupied(x, z, width = 1, depth = 1) {
        for (let dx = 0; dx < width; dx++) {
            for (let dz = 0; dz < depth; dz++) {
                if (this.occupiedCells.has(`${x + dx},${z + dz}`)) {
                    return true;
                }
            }
        }
        return false;
    }

    occupyCell(x, z, buildingData, width = 1, depth = 1) {
        for (let dx = 0; dx < width; dx++) {
            for (let dz = 0; dz < depth; dz++) {
                this.occupiedCells.set(`${x + dx},${z + dz}`, buildingData);
            }
        }
    }

    freeCell(x, z, width = 1, depth = 1) {
        for (let dx = 0; dx < width; dx++) {
            for (let dz = 0; dz < depth; dz++) {
                this.occupiedCells.delete(`${x + dx},${z + dz}`);
            }
        }
    }

    isValidPosition(x, z, width = 1, depth = 1) {
        return !this.isCellOccupied(x, z, width, depth);
    }

    getBuildingAt(x, z) {
        return this.occupiedCells.get(`${x},${z}`);
    }
}

class BuildingManager {
    constructor(scene, gridSystem, socket) {
        this.scene = scene;
        this.gridSystem = gridSystem;
        this.socket = socket;
        this.buildings = new Map();
        this.previewMesh = null;
        this.selectedBuildingType = null;
        this.editMode = false;
        this.buildingToEdit = null;
        this.selectionBox = null;
        this.movingBuilding = null;
    }

    setSelectedBuilding(type) {
        this.selectedBuildingType = type;
        this.editMode = false;
        this.buildingToEdit = null;
        this.movingBuilding = null;
        this.hideSelectionBox();
        this.showPreview(0, 0, type);
    }

    clearSelection() {
        this.selectedBuildingType = null;
        this.editMode = false;
        this.buildingToEdit = null;
        this.movingBuilding = null;
        this.hidePreview();
        this.hideSelectionBox();
    }

    createBuildingMesh(x, z, type) {
        const config = BUILDING_CONFIG[type];
        const buildingGroup = new THREE.Group();

        // Corps principal du bâtiment
        const mainGeometry = new THREE.BoxGeometry(config.width, config.height, config.depth);
        const mainMaterial = new THREE.MeshLambertMaterial({ 
            color: config.color
        });
        const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
        mainMesh.position.y = config.height / 2;
        mainMesh.castShadow = true;
        mainMesh.receiveShadow = true;
        buildingGroup.add(mainMesh);

        // Détails architecturaux
        switch(type) {
            case 'house':
                const roofGeometry = new THREE.ConeGeometry(config.width * 0.8, config.roofHeight, 4);
                const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
                const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
                roofMesh.position.y = config.height + config.roofHeight / 2;
                roofMesh.rotation.y = Math.PI / 4;
                buildingGroup.add(roofMesh);
                break;

            case 'factory':
                const chimneyGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
                const chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
                const chimneyMesh = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
                chimneyMesh.position.set(2, config.height + 2, 1);
                buildingGroup.add(chimneyMesh);
                break;

            case 'powerplant':
                const bigChimneyGeometry = new THREE.CylinderGeometry(1, 2, config.chimneyHeight, 16);
                const bigChimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
                const bigChimneyMesh = new THREE.Mesh(bigChimneyGeometry, bigChimneyMaterial);
                bigChimneyMesh.position.set(3, config.chimneyHeight / 2, 2);
                buildingGroup.add(bigChimneyMesh);
                break;

            case 'school':
                const schoolRoofGeometry = new THREE.ConeGeometry(config.width * 0.9, config.roofHeight, 4);
                const schoolRoofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
                const schoolRoofMesh = new THREE.Mesh(schoolRoofGeometry, schoolRoofMaterial);
                schoolRoofMesh.position.y = config.height + config.roofHeight / 2;
                schoolRoofMesh.rotation.y = Math.PI / 4;
                buildingGroup.add(schoolRoofMesh);
                break;

            case 'apartment':
                // Ajouter des fenêtres pour l'appartement
                for (let floor = 0; floor < (config.floors || 4); floor++) {
                    for (let i = -1; i <= 1; i += 2) {
                        const windowGeometry = new THREE.PlaneGeometry(0.8, 1);
                        const windowMaterial = new THREE.MeshLambertMaterial({ 
                            color: 0x87CEEB,
                            transparent: true,
                            opacity: 0.7
                        });
                        const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                        windowMesh.position.set(
                            i * (config.width / 2 - 0.3),
                            floor * 2 + 1.5,
                            config.depth / 2 + 0.1
                        );
                        windowMesh.rotation.y = Math.PI;
                        buildingGroup.add(windowMesh);
                    }
                }
                break;
        }

        // Porte pour les bâtiments résidentiels
        if (['house', 'school', 'apartment'].includes(type)) {
            const doorGeometry = new THREE.PlaneGeometry(1, 2);
            const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
            doorMesh.position.set(0, 1, config.depth / 2 + 0.1);
            doorMesh.rotation.y = Math.PI;
            buildingGroup.add(doorMesh);
        }

        buildingGroup.position.set(x, 0, z);
        buildingGroup.castShadow = true;
        buildingGroup.receiveShadow = true;

        // Stocker le type de bâtiment dans le mesh pour la sélection
        buildingGroup.userData = { buildingType: type, isBuilding: true };

        return buildingGroup;
    }

    showPreview(x, z, type) {
        this.hidePreview();
        if (!type) return;

        const config = BUILDING_CONFIG[type];
        const worldPos = this.gridSystem.gridToWorld(x, z);
        const isValid = this.gridSystem.isValidPosition(x, z, config.width / this.gridSystem.cellSize, config.depth / this.gridSystem.cellSize);

        this.previewMesh = this.createBuildingMesh(worldPos.x, worldPos.z, type);
        
        // Rendre l'aperçu semi-transparent
        this.previewMesh.traverse((child) => {
            if (child.isMesh) {
                child.material.transparent = true;
                child.material.opacity = 0.6;
                if (!isValid) {
                    child.material.color.setHex(0xff0000);
                }
            }
        });

        this.scene.add(this.previewMesh);
    }

    hidePreview() {
        if (this.previewMesh) {
            this.scene.remove(this.previewMesh);
            this.previewMesh = null;
        }
    }

    updatePreview(x, z) {
        if (this.selectedBuildingType && this.previewMesh) {
            const config = BUILDING_CONFIG[this.selectedBuildingType];
            const worldPos = this.gridSystem.gridToWorld(x, z);
            const isValid = this.gridSystem.isValidPosition(x, z, config.width / this.gridSystem.cellSize, config.depth / this.gridSystem.cellSize);

            this.previewMesh.position.set(worldPos.x, 0, worldPos.z);
            
            this.previewMesh.traverse((child) => {
                if (child.isMesh) {
                    if (!isValid) {
                        child.material.color.setHex(0xff0000);
                    } else {
                        child.material.color.setHex(BUILDING_CONFIG[this.selectedBuildingType].color);
                    }
                }
            });
        }
    }

    placeBuilding(x, z, type, playerId) {
        const config = BUILDING_CONFIG[type];
        const gridWidth = Math.ceil(config.width / this.gridSystem.cellSize);
        const gridDepth = Math.ceil(config.depth / this.gridSystem.cellSize);

        if (!this.gridSystem.isValidPosition(x, z, gridWidth, gridDepth)) {
            throw new Error('Emplacement déjà occupé ou invalide');
        }

        const worldPos = this.gridSystem.gridToWorld(x, z);
        const buildingMesh = this.createBuildingMesh(worldPos.x, worldPos.z, type);
        
        const buildingData = {
            id: `${playerId}_${Date.now()}`,
            type: type,
            x: x,
            z: z,
            gridWidth: gridWidth,
            gridDepth: gridDepth,
            playerId: playerId,
            mesh: buildingMesh
        };

        this.gridSystem.occupyCell(x, z, buildingData, gridWidth, gridDepth);
        this.buildings.set(buildingData.id, buildingData);
        this.scene.add(buildingMesh);

        this.socket.emit('placeBuilding', {
            x: x,
            z: z,
            type: type,
            playerId: playerId,
            gridWidth: gridWidth,
            gridDepth: gridDepth
        });

        return buildingData;
    }

    removeBuilding(buildingId) {
        const building = this.buildings.get(buildingId);
        if (building) {
            // Rembourser 50% du coût de construction
            if (this.uiManager.game && this.uiManager.game.resourceManager) {
                this.uiManager.game.resourceManager.refundBuilding(building.type);
            }
            
            this.scene.remove(building.mesh);
            this.gridSystem.freeCell(building.x, building.z, building.gridWidth, building.gridDepth);
            this.buildings.delete(buildingId);
            
<<<<<<< HEAD
=======
            if (this.uiManager.game && this.uiManager.game.resourceManager) {
                this.uiManager.game.resourceManager.calculateEmployment();
                this.uiManager.game.resourceManager.calculatePopulation();
                this.uiManager.game.resourceManager.updateStatisticsDisplay();
            }
            
>>>>>>> 21b6ef2 (nouveau test)
            this.socket.emit('removeBuilding', {
                buildingId: buildingId,
                playerId: building.playerId
            });
        }
    }

    
    startEditBuilding(buildingId) {
        const building = this.buildings.get(buildingId);
        if (building) {
            this.editMode = true;
            this.buildingToEdit = building;
            this.selectedBuildingType = null;
            this.movingBuilding = null;
            this.hidePreview();
            this.showSelectionBox(building);
            
            const event = new CustomEvent('buildingEditStarted', { 
                detail: { building: building } 
            });
            document.dispatchEvent(event);
            
            return true;
        }
        return false;
    }

    startMoveBuilding(buildingId) {
        const building = this.buildings.get(buildingId);
        if (building) {
            this.movingBuilding = building;
            this.editMode = true;
            this.buildingToEdit = building;
            this.selectedBuildingType = building.type;
            this.hideSelectionBox();
            this.showPreview(building.x, building.z, building.type);
            
            return true;
        }
        return false;
    }

    showSelectionBox(building) {
        this.hideSelectionBox();
        
        const config = BUILDING_CONFIG[building.type];
        const worldPos = this.gridSystem.gridToWorld(building.x, building.z);
        
        // Créer une boîte de sélection
        const geometry = new THREE.BoxGeometry(config.width + 0.5, config.height + 0.5, config.depth + 0.5);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        
        this.selectionBox = new THREE.Mesh(geometry, material);
        this.selectionBox.position.set(worldPos.x, config.height / 2, worldPos.z);
        this.scene.add(this.selectionBox);
    }

    hideSelectionBox() {
        if (this.selectionBox) {
            this.scene.remove(this.selectionBox);
            this.selectionBox = null;
        }
    }

    moveBuilding(buildingId, newX, newZ) {
        const building = this.buildings.get(buildingId);
        if (building) {
            const config = BUILDING_CONFIG[building.type];
            const gridWidth = Math.ceil(config.width / this.gridSystem.cellSize);
            const gridDepth = Math.ceil(config.depth / this.gridSystem.cellSize);

            // Vérifier si la nouvelle position est différente
            if (building.x === newX && building.z === newZ) {
                throw new Error('Le bâtiment est déjà à cette position');
            }

            // Vérifier si la nouvelle position est valide
            if (!this.gridSystem.isValidPosition(newX, newZ, gridWidth, gridDepth)) {
                throw new Error('Nouvel emplacement déjà occupé ou invalide');
            }

            // Libérer l'ancienne position
            this.gridSystem.freeCell(building.x, building.z, building.gridWidth, building.gridDepth);

            // Mettre à jour la position
            const oldX = building.x;
            const oldZ = building.z;
            
            building.x = newX;
            building.z = newZ;
            building.gridWidth = gridWidth;
            building.gridDepth = gridDepth;

            // Occuper la nouvelle position
            this.gridSystem.occupyCell(newX, newZ, building, gridWidth, gridDepth);

            // Mettre à jour la position visuelle
            const worldPos = this.gridSystem.gridToWorld(newX, newZ);
            building.mesh.position.set(worldPos.x, 0, worldPos.z);

            this.socket.emit('moveBuilding', {
                buildingId: buildingId,
                oldX: oldX,
                oldZ: oldZ,
                newX: newX,
                newZ: newZ,
                playerId: building.playerId
            });

            // Réinitialiser les états après le déplacement
            this.movingBuilding = null;
            this.editMode = false;
            this.buildingToEdit = null;
            this.selectedBuildingType = null;
            this.hidePreview();

            return building;
        }
        throw new Error('Bâtiment non trouvé');
    }

    getBuildingAtPosition(x, z) {
        const buildingData = this.gridSystem.getBuildingAt(x, z);
        if (buildingData) {
            return Array.from(this.buildings.values()).find(b => b.id === buildingData.id);
        }
        return null;
    }
}

class UIManager {
    constructor(socket) {
        this.socket = socket;
        this.resources = {
            money: 1000,
            materials: 500,
            population: 0
        };
<<<<<<< HEAD
=======
        this.currentCategory = 'all';
        this.resetToDefaultResources();
        this.setupStatisticsToggle();
        this.setupQuestsToggle();
>>>>>>> 21b6ef2 (nouveau test)
        this.init();
    }
    setupQuestsToggle() {
        // Créer le bouton de bascule des quêtes
        const toggleButton = document.createElement('button');
        toggleButton.id = 'toggle-quests';
        toggleButton.innerHTML = '🎯 Afficher les Quêtes';
        toggleButton.style.cssText = `
            position: fixed;
            top: 120px;
            left: 20px;
            background: #2d3748;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            cursor: pointer;
            z-index: 101;
            font-size: 14px;
            transition: all 0.3s;
        `;

        // Créer le panneau des quêtes
        const questsPanel = document.createElement('div');
        questsPanel.id = 'quests-panel';
        questsPanel.style.cssText = `
            position: fixed;
            top: 160px;
            left: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 16px;
            border-radius: 8px;
            z-index: 100;
            min-width: 300px;
            max-width: 400px;
            max-height: 500px;
            overflow-y: auto;
            backdrop-filter: blur(10px);
            border: 2px solid #4a5568;
            display: none;
        `;

        toggleButton.addEventListener('click', () => {
            const panel = document.getElementById('quests-panel');
            if (panel.style.display === 'none' || panel.style.display === '') {
                panel.style.display = 'block';
                toggleButton.innerHTML = '🎯 Masquer les Quêtes';
                toggleButton.style.background = '#4a5568';
                // Mettre à jour l'affichage quand on ouvre
                if (this.game && this.game.questManager) {
                    this.game.questManager.updateQuestDisplay();
                }
            } else {
                panel.style.display = 'none';
                toggleButton.innerHTML = '🎯 Afficher les Quêtes';
                toggleButton.style.background = '#2d3748';
            }
        });

        document.body.appendChild(toggleButton);
        document.body.appendChild(questsPanel);
    }
    
    updateQuestDisplay() {
        if (this.game && this.game.questManager) {
            this.game.questManager.updateQuestDisplay();
        }
    }


    resetToDefaultResources() {
        this.resources = {
            money: 2000,
            materials: 1000,
            population: 0,
            energy: 50,
            water: 50,
            education: 0,
            happiness: 50,
            health: 50,
            safety: 50,
            research: 0
        };
    }

    init() {
        this.updateResourceDisplay();
        this.setupBuildingInfo();
        this.setupEventListeners();
<<<<<<< HEAD
=======
        this.setupPathfindingControls();
        this.setupSaveLoadControls();
        this.setupStatisticsPanel();
        this.setupStatisticsToggle();
    }

        setupStatisticsToggle() {
        // Créer le bouton de bascule des statistiques
        const toggleButton = document.createElement('button');
        toggleButton.id = 'toggle-stats';
        toggleButton.innerHTML = '📊 Afficher les Statistiques';
        toggleButton.style.cssText = `
            position: fixed;
            top: 80px;
            left: 20px;
            background: #2d3748;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            cursor: pointer;
            z-index: 101;
            font-size: 14px;
            transition: all 0.3s;
        `;

        // Créer le panneau de statistiques
        const statsPanel = document.createElement('div');
        statsPanel.id = 'statistics-panel';
        statsPanel.style.cssText = `
            position: fixed;
            top: 120px;
            left: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 16px;
            border-radius: 8px;
            z-index: 100;
            min-width: 250px;
            backdrop-filter: blur(10px);
            border: 2px solid #4a5568;
            display: none;
        `;

        toggleButton.addEventListener('click', () => {
            const panel = document.getElementById('statistics-panel');
            if (panel.style.display === 'none' || panel.style.display === '') {
                panel.style.display = 'block';
                toggleButton.innerHTML = '📊 Masquer les Statistiques';
                toggleButton.style.background = '#4a5568';
                // Mettre à jour l'affichage quand on ouvre
                if (this.game && this.game.resourceManager) {
                    this.game.resourceManager.updateStatisticsDisplay();
                }
            } else {
                panel.style.display = 'none';
                toggleButton.innerHTML = '📊 Afficher les Statistiques';
                toggleButton.style.background = '#2d3748';
            }
        });

        document.body.appendChild(toggleButton);
        document.body.appendChild(statsPanel);
    }

    setupStatisticsPanel() {
        if (!document.getElementById('statistics-panel')) {
            const statsPanel = document.createElement('div');
            statsPanel.id = 'statistics-panel';
            statsPanel.style.cssText = `
                position: fixed;
                top: 120px;
                left: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 16px;
                border-radius: 8px;
                z-index: 100;
                min-width: 200px;
                backdrop-filter: blur(10px);
            `;
            document.body.appendChild(statsPanel);
        }
>>>>>>> 21b6ef2 (nouveau test)
    }

    updateResourceDisplay() {
        const moneyEl = document.getElementById('money');
        const materialsEl = document.getElementById('materials');
        const populationEl = document.getElementById('population');
        
        if (moneyEl) moneyEl.textContent = this.resources.money;
        if (materialsEl) materialsEl.textContent = this.resources.materials;
        if (populationEl) populationEl.textContent = this.resources.population;
    }

    setupBuildingInfo() {
        const buildingInfo = {
            house: { name: 'Maison', cost: '100💰 50🔧', production: '+10👥', color: '#8B4513' },
            road: { name: 'Route', cost: '50💰 20🔧', production: 'Accès', color: '#333333' },
            factory: { name: 'Usine', cost: '500💰 300🔧', production: '+5💰 +2🔧/min', color: '#666666' },
            powerplant: { name: 'Centrale', cost: '1000💰 800🔧', production: '+10💰/min', color: '#444444' },
            school: { name: 'École', cost: '300💰 200🔧', production: '+3💰 +5👥/min', color: '#4682B4' },
            apartment: { name: 'Appartement', cost: '400💰 300🔧', production: '+25👥', color: '#708090' }
        };

        document.querySelectorAll('.building-btn').forEach(btn => {
            const type = btn.dataset.type;
            const info = buildingInfo[type];
            if (info) {
                btn.title = `${info.name}\nCoût: ${info.cost}\nProduction: ${info.production}`;
                btn.style.borderLeft = `4px solid ${info.color}`;
            }
        });
    }

    setupEventListeners() {
        // Gestion de la sélection des bâtiments
        document.querySelectorAll('.building-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const buildingType = e.target.dataset.type;
                
                if (e.target.classList.contains('selected')) {
                    this.deselectAllBuildings();
                } else {
                    this.selectBuilding(buildingType);
                }
            });
        });

        // Bouton d'annulation de construction
        const cancelBtn = document.getElementById('cancel-placement');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.deselectAllBuildings();
            });
        }

        // Clic droit pour déselectionner
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.deselectAllBuildings();
        });

        // Touche Echap pour déselectionner
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.deselectAllBuildings();
            }
        });

        // Délégation d'événements pour les boutons d'édition dynamiques
        document.addEventListener('click', (e) => {
            if (e.target.id === 'delete-building' || e.target.closest('#delete-building')) {
                const event = new CustomEvent('deleteBuilding');
                document.dispatchEvent(event);
            }
            else if (e.target.id === 'move-building' || e.target.closest('#move-building')) {
                const event = new CustomEvent('startMoveBuilding');
                document.dispatchEvent(event);
            }
            else if (e.target.id === 'cancel-edit' || e.target.closest('#cancel-edit')) {
                const event = new CustomEvent('cancelEdit');
                document.dispatchEvent(event);
            }
        });
    }

    selectBuilding(buildingType) {
        this.deselectAllBuildings();
        
        document.querySelectorAll('.building-btn').forEach(btn => {
            if (btn.dataset.type === buildingType) {
                btn.classList.add('selected');
            }
        });
        
        const event = new CustomEvent('buildingSelected', { 
            detail: { type: buildingType } 
        });
        document.dispatchEvent(event);
    }

    deselectAllBuildings() {
        document.querySelectorAll('.building-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        const event = new CustomEvent('buildingCancelled');
        document.dispatchEvent(event);
        
        this.updateInfoPanel();
    }

    showEditPanel(buildingData) {
        const infoContent = document.getElementById('info-content');
        if (infoContent && buildingData) {
            const config = BUILDING_CONFIG[buildingData.type];
            infoContent.innerHTML = `
                <div class="building-details">
                    <h4>${config.name} - Édition</h4>
                    <p><strong>Position :</strong> ${buildingData.x}, ${buildingData.z}</p>
                    <p><strong>Taille :</strong> ${config.width}x${config.depth}</p>
                    <p><strong>Coût :</strong> ${config.cost.money}💰 ${config.cost.materials}🔧</p>
                    <p><em>Choisissez une action :</em></p>
                </div>
                <div class="edit-controls">
                    <button id="move-building" class="edit-btn move-btn">
                        <span>📦</span>
                        <span>Déplacer</span>
                    </button>
                    <button id="delete-building" class="edit-btn delete-btn">
                        <span>🗑️</span>
                        <span>Supprimer</span>
                    </button>
                    <button id="cancel-edit" class="edit-btn cancel-edit-btn">
                        <span>✖</span>
                        <span>Fermer</span>
                    </button>
                </div>
                <div class="edit-instructions">
                    <p><small>💡 <strong>Déplacement :</strong> Cliquez sur "Déplacer" puis sur la nouvelle position</small></p>
                    <p><small>💡 <strong>Annuler :</strong> Clic droit pendant le déplacement</small></p>
                </div>
            `;
        }
    }

    updateInfoPanel() {
        const infoContent = document.getElementById('info-content');
        if (infoContent) {
            infoContent.innerHTML = `
                <p><em>Sélectionnez un bâtiment pour construire ou cliquez sur un bâtiment existant pour l'éditer</em></p>
                <div class="controls-info">
                    <h4>Commandes</h4>
                    <ul class="controls-list">
                        <li>🖱️ Clic gauche vide : Construire</li>
                        <li>🖱️ Clic gauche bâtiment : Éditer</li>
                        <li>🖱️ Clic droit : Désélectionner / Annuler</li>
                        <li>🔄 Rotation : Clic gauche + glisser</li>
                        <li>📦 Déplacement caméra : Clic droit + glisser</li>
                        <li>📜 Molette : Zoom</li>
                        <li>⎋ Echap : Annuler</li>
                    </ul>
                </div>
                <button id="cancel-placement" class="cancel-btn">
                    ✖ Annuler la construction
                </button>
            `;

            // Réattacher l'événement au bouton d'annulation
            const cancelBtn = document.getElementById('cancel-placement');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.deselectAllBuildings();
                });
            }
        }
    }

    updateResources(newResources) {
        this.resources = { ...this.resources, ...newResources };
        this.updateResourceDisplay();
    }

    showMessage(message, type = 'info') {
        // Supprimer les notifications existantes
        document.querySelectorAll('.notification').forEach(notification => {
            notification.remove();
        });

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            background: ${type === 'error' ? '#ff6b6b' : type === 'success' ? '#4cd964' : '#8b9dff'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            font-weight: 500;
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

class CityBuilderGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.socket = null;
        this.gridSize = 200;
        this.cellSize = 4;
        this.cameraController = null;
        this.gridSystem = null;
        this.buildingManager = null;
        this.uiManager = null;
        this.currentHoverPos = null;
        this.movingBuilding = null;
        this.editingBuilding = null;
        
        this.init();
        this.clearSavesOnRefresh();
    }

    init() {
        this.initThreeJS();
        this.initSocket();
        this.initManagers();
        this.initEventListeners();
        this.animate();
    }

        clearSavesOnRefresh() {
        // Supprimer toutes les sauvegardes existantes au chargement de la page
        const savesToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('citybuilder_')) {
                savesToRemove.push(key);
            }
        }
        
        savesToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log('Sauvegardes nettoyées, retour aux valeurs initiales');
    }

    initThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(this.renderer.domElement);
        }

        this.setupLighting();
        this.createRealisticTerrain();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
    }

    createRealisticTerrain() {
        const terrainGeometry = new THREE.PlaneGeometry(this.gridSize, this.gridSize, 1, 1);
        const terrainMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3a7d3a,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;
        this.scene.add(terrain);
    }

        init() {
        try {
            this.initThreeJS();
            this.initSocket();
            this.initManagers();
            this.initEventListeners();
            this.setupQuestPanel();
            this.animate();
            
            // Ne PAS charger de sauvegarde automatique au démarrage
            // this.saveManager.startAutoSave();
            // this.saveManager.loadGame('autosave');
            
        } catch (error) {
            this.errorManager.logError('Game initialization', error, 'error');
        }
    }

    initSocket() {
        this.socket = io('http://localhost:3000');
        
        this.socket.on('gameState', (gameState) => {
            this.loadGameState(gameState);
        });

        this.socket.on('buildingPlaced', (building) => {
            this.handleBuildingPlaced(building);
        });

        this.socket.on('buildingRemoved', (data) => {
            this.handleBuildingRemoved(data);
        });

        this.socket.on('buildingMoved', (data) => {
            this.handleBuildingMoved(data);
        });

        this.socket.on('buildingError', (error) => {
            this.uiManager.showMessage(error.message, 'error');
        });

        this.socket.on('resourcesUpdate', (resources) => {
            this.uiManager.updateResources(resources);
        });
    }

    initManagers() {
        this.gridSystem = new GridSystem(this.gridSize, this.cellSize);
        this.buildingManager = new BuildingManager(this.scene, this.gridSystem, this.socket);
        this.cameraController = new AdvancedCameraController(this.camera, this.renderer.domElement);
        this.uiManager = new UIManager(this.socket);
    }

    initEventListeners() {
        // Événements de sélection de bâtiment
        document.addEventListener('buildingSelected', (e) => {
            this.buildingManager.setSelectedBuilding(e.detail.type);
            this.movingBuilding = null;
            this.editingBuilding = null;
        });

        document.addEventListener('buildingCancelled', () => {
            this.buildingManager.clearSelection();
            this.currentHoverPos = null;
            this.movingBuilding = null;
            this.editingBuilding = null;
        });

        // Événement quand l'édition d'un bâtiment commence
        document.addEventListener('buildingEditStarted', (e) => {
            this.editingBuilding = e.detail.building;
            this.movingBuilding = null;
            this.uiManager.showEditPanel(e.detail.building);
        });

        // Événements d'édition
        document.addEventListener('deleteBuilding', () => {
            if (this.buildingManager.buildingToEdit) {
                this.buildingManager.removeBuilding(this.buildingManager.buildingToEdit.id);
                this.buildingManager.clearSelection();
                this.editingBuilding = null;
                this.uiManager.showMessage('Bâtiment supprimé', 'success');
                this.uiManager.updateInfoPanel();
            }
        });

        document.addEventListener('startMoveBuilding', () => {
            if (this.buildingManager.buildingToEdit) {
                if (this.buildingManager.startMoveBuilding(this.buildingManager.buildingToEdit.id)) {
                    this.movingBuilding = this.buildingManager.buildingToEdit;
                    this.uiManager.showMessage('Cliquez sur une nouvelle position pour déplacer le bâtiment. Clic droit pour annuler.', 'info');
                }
            }
        });

        document.addEventListener('cancelEdit', () => {
            this.buildingManager.clearSelection();
            this.movingBuilding = null;
            this.editingBuilding = null;
            this.uiManager.updateInfoPanel();
        });

        // Gestion du survol de la souris
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            this.handleMouseMove(event);
        });

        // Gestion du clic
        this.renderer.domElement.addEventListener('click', (event) => {
            this.handleClick(event);
        });

        // Gestion du clic droit pour annuler le déplacement
        this.renderer.domElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.movingBuilding) {
                this.buildingManager.clearSelection();
                this.movingBuilding = null;
                this.uiManager.showMessage('Déplacement annulé', 'info');
                this.uiManager.updateInfoPanel();
            }
        });

        // Redimensionnement
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.renderer.domElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    handleMouseMove(event) {
        const mouse = new THREE.Vector2();
        const rect = this.renderer.domElement.getBoundingClientRect();
        
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectionPoint = new THREE.Vector3();
        
        if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
            const gridPos = this.gridSystem.worldToGrid(intersectionPoint.x, intersectionPoint.z);
            
            if (!this.currentHoverPos || this.currentHoverPos.x !== gridPos.x || this.currentHoverPos.z !== gridPos.z) {
                this.currentHoverPos = gridPos;
                
                // Mode déplacement de bâtiment
                if (this.movingBuilding) {
                    this.buildingManager.updatePreview(gridPos.x, gridPos.z);
                }
                // Mode construction normale
                else if (this.buildingManager.selectedBuildingType) {
                    this.buildingManager.updatePreview(gridPos.x, gridPos.z);
                }
            }
        }
    }

    handleClick(event) {
        if (!this.currentHoverPos) return;

        // Mode déplacement de bâtiment
        if (this.movingBuilding) {
            try {
                this.buildingManager.moveBuilding(
                    this.movingBuilding.id,
                    this.currentHoverPos.x,
                    this.currentHoverPos.z
                );
                this.uiManager.showMessage('Bâtiment déplacé avec succès!', 'success');
                this.movingBuilding = null;
                this.uiManager.updateInfoPanel();
            } catch (error) {
                this.uiManager.showMessage(error.message, 'error');
            }
            return;
        }

        // Vérifier si on clique sur un bâtiment existant (uniquement si pas en mode construction)
        if (!this.buildingManager.selectedBuildingType) {
            const building = this.buildingManager.getBuildingAtPosition(this.currentHoverPos.x, this.currentHoverPos.z);
            if (building) {
                // Éditer le bâtiment existant
                if (this.buildingManager.startEditBuilding(building.id)) {
                    this.editingBuilding = building;
                    this.uiManager.showEditPanel(building);
                }
                return;
            }
        }

        // Mode construction normale
        if (this.buildingManager.selectedBuildingType) {
            try {
                this.buildingManager.placeBuilding(
                    this.currentHoverPos.x, 
                    this.currentHoverPos.z, 
                    this.buildingManager.selectedBuildingType, 
                    this.socket.id
                );
                this.uiManager.showMessage('Bâtiment placé avec succès!', 'success');
            } catch (error) {
                this.uiManager.showMessage(error.message, 'error');
            }
        }
    }

    loadGameState(gameState) {
        this.buildingManager.buildings.forEach(building => {
            this.scene.remove(building.mesh);
        });
        this.buildingManager.buildings.clear();
        this.gridSystem.occupiedCells.clear();

        if (gameState.buildings) {
            gameState.buildings.forEach(building => {
                this.buildingManager.placeBuilding(
                    building.x, 
                    building.z, 
                    building.type, 
                    building.playerId
                );
            });
        }
    }

    handleBuildingPlaced(building) {
        try {
            this.buildingManager.placeBuilding(
                building.x, 
                building.z, 
                building.type, 
                building.playerId
            );
        } catch (error) {
            console.warn('Bâtiment déjà placé:', error.message);
        }
    }

    handleBuildingRemoved(data) {
        this.buildingManager.removeBuilding(data.buildingId);
    }

    handleBuildingMoved(data) {
        const building = this.buildingManager.buildings.get(data.buildingId);
        if (building) {
            this.buildingManager.moveBuilding(data.buildingId, data.newX, data.newZ);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.cameraController) {
            this.cameraController.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Démarrer le jeu
window.addEventListener('DOMContentLoaded', () => {
    new CityBuilderGame();
});