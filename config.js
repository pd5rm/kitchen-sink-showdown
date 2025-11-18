// Game Configuration
const CONFIG = {
    // Canvas settings
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 800,

    // Sink dimensions (top-down view - square shape, 80% of canvas)
    SINK: {
        CENTER_X: 400,
        CENTER_Y: 400,
        WIDTH: 640,  // 80% of 800px canvas
        HEIGHT: 640,
        DRAIN_RADIUS: 40,
        WALL_THICKNESS: 20,
        INCLINE_STRENGTH: 0 // Disabled - objects should not move on their own
    },

    // Water settings
    WATER: {
        DROP_RADIUS: 8,
        DROP_RATE: 50, // milliseconds between drops when holding mouse
        DROP_FORCE: 0.002,
        DROP_MASS: 0.5,
        GALLONS_PER_DROP: 0.1, // ~27 gallons = 2700 drops for national average
        SPLASH_FORCE: 0.001,
        FRICTION: 0.05,
        RESTITUTION: 0.6, // bounciness
        WALL_RESTITUTION: 0.7 // walls are bouncier for eddies
    },

    // Game limits
    LIMITS: {
        WATER_LIMIT_GALLONS: 27, // US national average for hand dishwashing
        DRAIN_CAPTURE_RADIUS: 50 // how close object needs to be to drain to count
    },

    // Levels configuration
    LEVELS: [
        {
            level: 1,
            name: "Single Spinach Leaf",
            foodItems: ['spinach'],
            waterLimit: 5, // gallons
            description: "Tutorial: Push the spinach leaf into the drain!"
        },
        {
            level: 2,
            name: "Spinach & Mushroom",
            foodItems: ['spinach', 'mushroom'],
            waterLimit: 8,
            description: "Two items, different weights!"
        },
        {
            level: 3,
            name: "Pasta Party",
            foodItems: ['spinach', 'mushroom', 'mushroom', 'spaghetti', 'spaghetti'],
            waterLimit: 15,
            description: "Spaghetti is slippery!"
        },
        {
            level: 4,
            name: "Veggie Medley",
            foodItems: ['spinach', 'spinach', 'mushroom', 'mushroom', 'spaghetti', 'carrot'],
            waterLimit: 20,
            description: "Heavy carrot joins the party"
        },
        {
            level: 5,
            name: "Kitchen Chaos",
            foodItems: ['spinach', 'spinach', 'mushroom', 'spaghetti', 'spaghetti', 'carrot', 'pea', 'pea'],
            waterLimit: 28,
            description: "Tiny pea challenge!"
        },
        {
            level: 6,
            name: "Bean There",
            foodItems: ['spinach', 'mushroom', 'spaghetti', 'carrot', 'pea', 'bean'],
            waterLimit: 30,
            description: "Small but firm bean!"
        },
        {
            level: 7,
            name: "Tomato Finale",
            foodItems: ['spinach', 'mushroom', 'spaghetti', 'carrot', 'pea', 'bean', 'tomato'],
            waterLimit: 35,
            description: "The ultimate sink challenge!"
        }
    ],

    // Food item properties
    // Properties: mass (weight), friction (stickiness), restitution (bounciness), size
    FOOD_ITEMS: {
        spinach: {
            name: 'Spinach Leaf',
            mass: 0.3,
            friction: 0.572,
            restitution: 0.2,
            radius: 20,
            sprite: '🥬',
            spriteSize: 40, // size to render sprite
            description: 'Light and floaty'
        },
        mushroom: {
            name: 'Mushroom Slice',
            mass: 0.8,
            friction: 0.715,
            restitution: 0.3,
            radius: 18,
            sprite: '🍄',
            spriteSize: 36,
            description: 'Medium weight, slightly sticky'
        },
        spaghetti: {
            name: 'Spaghetti Strand',
            mass: 0.5,
            friction: 0.286, // very slippery!
            restitution: 0.4,
            radius: 15,
            width: 40, // special elongated shape
            height: 12,
            sprite: '🍜',
            spriteSize: 38,
            description: 'Slippery noodle'
        },
        carrot: {
            name: 'Carrot Chunk',
            mass: 1.2, // heavy!
            friction: 0.858,
            restitution: 0.3,
            radius: 16,
            sprite: '🥕',
            spriteSize: 32,
            description: 'Heavy and dense'
        },
        pea: {
            name: 'Pea',
            mass: 0.2, // very light
            friction: 0.429,
            restitution: 0.5, // bouncy!
            radius: 8, // very small!
            sprite: '🟢',
            spriteSize: 16,
            description: 'Tiny and bouncy'
        },
        bean: {
            name: 'Bean',
            mass: 0.4,
            friction: 0.5,
            restitution: 0.45,
            radius: 10,
            sprite: '🫘',
            spriteSize: 20,
            description: 'Small and firm'
        },
        tomato: {
            name: 'Cherry Tomato',
            mass: 0.6,
            friction: 0.6,
            restitution: 0.25, // soft, doesn't bounce much
            radius: 18,
            sprite: '🍅',
            spriteSize: 36,
            description: 'Soft and squishy'
        }
    },

    // Physics settings
    PHYSICS: {
        GRAVITY_X: 0,
        GRAVITY_Y: 0, // top-down view, no gravity
        DRAIN_FORCE: 0.0002, // force pulling items toward drain (reduced for more resistance)
        DRAIN_FORCE_RADIUS: 60 // radius around drain where force is applied (reduced from 100)
    },

    // UI Colors (cartoon style)
    COLORS: {
        BACKGROUND: '#E8F5E9', // light mint green
        COUNTER: '#8D6E63', // brown counter
        SINK_OUTER: '#ECEFF1', // light gray steel
        SINK_INNER: '#CFD8DC', // darker gray
        SINK_SHADOW: '#90A4AE', // shadow for depth
        DRAIN: '#263238', // dark gray, almost black
        DRAIN_GRATE: '#37474F',
        WATER: '#42A5F5', // bright blue
        WATER_GLOW: '#64B5F6',
        UI_PANEL: '#FFFFFF',
        UI_BORDER: '#78909C',
        TEXT: '#263238',
        TEXT_LIGHT: '#546E7A',
        SUCCESS: '#66BB6A',
        WARNING: '#FFA726',
        DANGER: '#EF5350'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
