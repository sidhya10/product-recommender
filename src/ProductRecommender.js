import React, { useState, useRef, useEffect } from 'react';
import _ from 'lodash';

const ProductRecommender = () => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hi there! I can help you find the perfect tech product based on your needs. What are you looking for today? (For example: laptop, smartphone, headphones, etc.)'
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [productContext, setProductContext] = useState({
        category: null,
        budget: null,
        preferences: [],
        stage: 'initial'
    });
    const messagesEndRef = useRef(null);

    // Sample product database
    const products = [
        {
            id: 1,
            category: 'laptop',
            name: 'ProBook X5',
            price: 1299,
            features: ['13" Retina display', '16GB RAM', '512GB SSD', 'All-day battery life', 'Ultra-lightweight'],
            idealFor: ['professionals', 'travelers', 'students', 'designers'],
            rating: 4.8,
            image: '/api/placeholder/300/200'
        },
        {
            id: 2,
            category: 'laptop',
            name: 'TechMaster 7000',
            price: 999,
            features: ['15.6" FHD display', '8GB RAM', '256GB SSD', 'Gaming graphics card', 'Customizable keyboard'],
            idealFor: ['gamers', 'students', 'casual users'],
            rating: 4.3,
            image: '/api/placeholder/300/200'
        },
        {
            id: 3,
            category: 'laptop',
            name: 'UltraSlim Pro',
            price: 1499,
            features: ['14" 4K OLED display', '32GB RAM', '1TB SSD', 'Precision touchpad', 'Professional graphics'],
            idealFor: ['designers', 'video editors', 'professionals'],
            rating: 4.9,
            image: '/api/placeholder/300/200'
        },
        {
            id: 4,
            category: 'smartphone',
            name: 'Galaxy Ultra',
            price: 899,
            features: ['6.7" Super AMOLED', '8GB RAM', '256GB Storage', 'Triple camera system', 'All-day battery'],
            idealFor: ['photographers', 'professionals', 'tech enthusiasts'],
            rating: 4.7,
            image: '/api/placeholder/200/300'
        },
        {
            id: 5,
            category: 'smartphone',
            name: 'Pixel Pro',
            price: 799,
            features: ['6.4" OLED display', 'Best-in-class camera', 'Clean OS experience', 'Fast charging', 'Long-term updates'],
            idealFor: ['photographers', 'Android purists', 'casual users'],
            rating: 4.6,
            image: '/api/placeholder/200/300'
        },
        {
            id: 6,
            category: 'smartphone',
            name: 'Budget King 5',
            price: 349,
            features: ['6.5" LCD display', 'Decent camera', '128GB Storage', 'Headphone jack', 'Expandable storage'],
            idealFor: ['budget-conscious users', 'students', 'casual users'],
            rating: 4.2,
            image: '/api/placeholder/200/300'
        },
        {
            id: 7,
            category: 'headphones',
            name: 'SoundMaster Pro',
            price: 299,
            features: ['Active noise cancellation', 'Hi-Res audio', '30-hour battery life', 'Premium build quality', 'Spatial audio'],
            idealFor: ['audiophiles', 'travelers', 'professionals'],
            rating: 4.8,
            image: '/api/placeholder/300/200'
        },
        {
            id: 8,
            category: 'headphones',
            name: 'BassBoost 700',
            price: 179,
            features: ['Enhanced bass response', 'Comfortable fit', '25-hour battery life', 'Built-in mic', 'Foldable design'],
            idealFor: ['bass lovers', 'commuters', 'casual listeners'],
            rating: 4.4,
            image: '/api/placeholder/300/200'
        },
        {
            id: 9,
            category: 'headphones',
            name: 'EcoSound Mini',
            price: 89,
            features: ['Compact design', 'Good sound quality', '20-hour battery', 'Water resistant', 'Built-in controls'],
            idealFor: ['budget-conscious users', 'gym-goers', 'casual listeners'],
            rating: 4.1,
            image: '/api/placeholder/300/200'
        }
    ];

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Process user message and generate response
    const processMessage = async (userMessage) => {
        // Add user message to chat
        setMessages(prevMessages => [...prevMessages, { role: 'user', content: userMessage }]);

        // Simulate AI processing
        setIsTyping(true);

        // Wait a moment to simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate AI response based on context
        let response;
        let newContext = { ...productContext };

        // Parse user input for intent
        const lowercaseMessage = userMessage.toLowerCase();

        // STAGE 1: Initial intent detection
        if (productContext.stage === 'initial') {
            // Check for product category
            const categoryKeywords = {
                'laptop': ['laptop', 'notebook', 'computer', 'pc', 'macbook'],
                'smartphone': ['phone', 'smartphone', 'mobile', 'iphone', 'android', 'cell phone'],
                'headphones': ['headphones', 'earbuds', 'headset', 'earphones', 'airpods']
            };

            let detectedCategory = null;
            Object.entries(categoryKeywords).forEach(([category, keywords]) => {
                if (keywords.some(keyword => lowercaseMessage.includes(keyword))) {
                    detectedCategory = category;
                }
            });

            if (detectedCategory) {
                newContext.category = detectedCategory;
                newContext.stage = 'budget';
                response = `Great! I'll help you find the perfect ${detectedCategory}. What's your budget range?`;
            } else {
                response = "I'm not sure what product you're looking for. Could you specify if you're interested in a laptop, smartphone, headphones, or something else?";
            }
        }

        // STAGE 2: Budget collection
        else if (productContext.stage === 'budget') {
            // Extract budget information
            const budgetRegex = /\$?(\d+)(?:\s*-\s*\$?(\d+))?/;
            const budgetMatch = lowercaseMessage.match(budgetRegex);

            if (budgetMatch) {
                if (budgetMatch[2]) {
                    // Range provided
                    const minBudget = parseInt(budgetMatch[1]);
                    const maxBudget = parseInt(budgetMatch[2]);
                    newContext.budget = { min: minBudget, max: maxBudget };
                } else {
                    // Single value provided, treat as maximum
                    const maxBudget = parseInt(budgetMatch[1]);
                    newContext.budget = { max: maxBudget };
                }

                newContext.stage = 'preferences';
                response = `Got it, your budget is around ${newContext.budget.min ? `$${newContext.budget.min} to $${newContext.budget.max}` : `up to $${newContext.budget.max}`}. What features or qualities are important to you for this ${newContext.category}? (For example: battery life, performance, portability, etc.)`;
            } else {
                response = `I didn't catch your budget. Could you provide a price range for the ${newContext.category} you're looking for?`;
            }
        }

        // STAGE 3: Preferences collection
        else if (productContext.stage === 'preferences') {
            // Keywords to look for based on category
            const preferenceKeywords = {
                'laptop': {
                    'performance': ['performance', 'fast', 'powerful', 'speed', 'processing'],
                    'portability': ['portable', 'light', 'lightweight', 'thin', 'travel'],
                    'battery': ['battery', 'long-lasting', 'all day'],
                    'display': ['screen', 'display', 'retina', '4k', 'resolution'],
                    'storage': ['storage', 'ssd', 'hard drive', 'space'],
                    'gaming': ['gaming', 'game', 'fps', 'graphics card', 'gpu']
                },
                'smartphone': {
                    'camera': ['camera', 'photo', 'photography', 'pictures', 'selfie'],
                    'battery': ['battery', 'long-lasting', 'all day'],
                    'display': ['screen', 'display', 'amoled', 'lcd', 'oled'],
                    'storage': ['storage', 'memory', 'space'],
                    'performance': ['performance', 'fast', 'speed', 'powerful']
                },
                'headphones': {
                    'sound': ['sound', 'audio', 'quality', 'bass'],
                    'noise': ['noise cancellation', 'anc', 'quiet', 'silence'],
                    'battery': ['battery', 'long-lasting'],
                    'comfort': ['comfort', 'comfortable', 'fit'],
                    'wireless': ['wireless', 'bluetooth', 'cordless']
                }
            };

            const categoryPreferences = preferenceKeywords[newContext.category] || {};
            const detectedPreferences = [];

            Object.entries(categoryPreferences).forEach(([preference, keywords]) => {
                if (keywords.some(keyword => lowercaseMessage.includes(keyword))) {
                    detectedPreferences.push(preference);
                }
            });

            if (detectedPreferences.length > 0) {
                newContext.preferences = [...productContext.preferences, ...detectedPreferences];
                newContext.stage = 'recommendation';
                response = `Thanks for sharing your preferences! Based on what you've told me, I'll find some ${newContext.category} options that match your needs.`;
            } else {
                // If no preferences detected but we need to move forward
                if (lowercaseMessage.length > 10) {
                    newContext.stage = 'recommendation';
                    newContext.preferences = [...productContext.preferences, 'general'];
                    response = `Thanks for the information! Let me find some ${newContext.category} options that might work for you.`;
                } else {
                    response = `Could you tell me more about what features are important to you in a ${newContext.category}?`;
                }
            }
        }

        // Generate recommendations
        if (newContext.stage === 'recommendation') {
            // Filter products based on category
            let filteredProducts = products.filter(p => p.category === newContext.category);

            // Filter by budget if available
            if (newContext.budget) {
                if (newContext.budget.min && newContext.budget.max) {
                    filteredProducts = filteredProducts.filter(p => p.price >= newContext.budget.min && p.price <= newContext.budget.max);
                } else if (newContext.budget.max) {
                    filteredProducts = filteredProducts.filter(p => p.price <= newContext.budget.max);
                }
            }

            // Sort by relevance to preferences
            if (newContext.preferences.length > 0) {
                filteredProducts = filteredProducts.sort((a, b) => {
                    let scoreA = 0;
                    let scoreB = 0;

                    // Simple scoring based on features and preferences
                    newContext.preferences.forEach(pref => {
                        if (a.features.some(f => f.toLowerCase().includes(pref.toLowerCase()))) scoreA += 1;
                        if (b.features.some(f => f.toLowerCase().includes(pref.toLowerCase()))) scoreB += 1;
                    });

                    return scoreB - scoreA;
                });
            }

            // Take top 3 recommendations
            const recommendations = filteredProducts.slice(0, 3);

            if (recommendations.length > 0) {
                // Create recommendations message
                response = `Based on your preferences, here are my top recommendations:`;

                // Add recommendation card
                setMessages(prevMessages => [
                    ...prevMessages,
                    { role: 'assistant', content: response },
                    { role: 'assistant', content: '', recommendations }
                ]);

                // Reset context for new recommendations
                newContext = {
                    category: null,
                    budget: null,
                    preferences: [],
                    stage: 'feedback'
                };

                setProductContext(newContext);
                setIsTyping(false);
                return;
            } else {
                response = `I couldn't find any ${newContext.category} that match your criteria. Would you like to try with a different budget or category?`;
                newContext.stage = 'initial';
            }
        }

        // STAGE 4: Handle feedback
        else if (productContext.stage === 'feedback') {
            const positiveKeywords = ['like', 'good', 'great', 'excellent', 'perfect', 'love', 'nice', 'yes', 'thanks'];
            const negativeKeywords = ['don\'t like', 'not good', 'too expensive', 'dislike', 'no', 'not what', 'different'];

            const isPositive = positiveKeywords.some(keyword => lowercaseMessage.includes(keyword));
            const isNegative = negativeKeywords.some(keyword => lowercaseMessage.includes(keyword));

            if (isPositive) {
                response = "I'm glad you like the recommendations! Is there anything specific you'd like to know about any of these products?";
            } else if (isNegative) {
                response = "I'm sorry these weren't quite right. Could you tell me what you're looking for differently, and I'll find better options?";
                newContext.stage = 'initial';
            } else {
                // Check if it's a question about a specific product
                const productNames = products.map(p => p.name.toLowerCase());
                const mentionedProduct = productNames.find(name => lowercaseMessage.includes(name.toLowerCase()));

                if (mentionedProduct) {
                    const product = products.find(p => p.name.toLowerCase() === mentionedProduct);
                    response = `The ${product.name} is a great choice! It features ${product.features.join(', ')}. It's particularly good for ${product.idealFor.join(', ')}. Is there anything specific you'd like to know about it?`;
                } else {
                    response = "Would you like to see more recommendations, or shall we refine your search criteria?";
                }
            }
        }

        setProductContext(newContext);
        setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: response }]);
        setIsTyping(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (inputText.trim() === '') return;

        await processMessage(inputText);
        setInputText('');
    };

    // Handle demo buttons for predefined flows
    const runDemo = async (demoType) => {
        switch(demoType) {
            case 'laptop':
                await processMessage("I need a new laptop for work");
                setTimeout(async () => {
                    await processMessage("My budget is around $1000-1500");
                    setTimeout(async () => {
                        await processMessage("I need something with good battery life and powerful enough for video editing");
                    }, 3000);
                }, 3000);
                break;
            case 'phone':
                await processMessage("Looking for a new smartphone");
                setTimeout(async () => {
                    await processMessage("I can spend up to $800");
                    setTimeout(async () => {
                        await processMessage("I really care about camera quality and battery life");
                    }, 3000);
                }, 3000);
                break;
            case 'headphones':
                await processMessage("I want wireless headphones");
                setTimeout(async () => {
                    await processMessage("Under $200 please");
                    setTimeout(async () => {
                        await processMessage("Noise cancellation would be nice for my commute");
                    }, 3000);
                }, 3000);
                break;
        }
    };

    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto bg-gray-50">
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="bg-blue-600 text-white p-4 shadow-md">
                    <h1 className="text-2xl font-bold">Product AI Assistant</h1>
                    <p className="text-sm opacity-90">Ask me about tech products and I'll help you find the perfect match</p>
                </div>

                {/* Demo buttons */}
                <div className="bg-blue-100 p-3 flex space-x-2 overflow-x-auto">
                    <span className="text-sm text-blue-800 font-medium whitespace-nowrap my-auto">Try a demo:</span>
                    <button
                        onClick={() => runDemo('laptop')}
                        className="bg-white hover:bg-blue-50 text-blue-600 text-sm font-medium py-1 px-3 rounded-full shadow-sm"
                    >
                        Laptop search
                    </button>
                    <button
                        onClick={() => runDemo('phone')}
                        className="bg-white hover:bg-blue-50 text-blue-600 text-sm font-medium py-1 px-3 rounded-full shadow-sm"
                    >
                        Smartphone search
                    </button>
                    <button
                        onClick={() => runDemo('headphones')}
                        className="bg-white hover:bg-blue-50 text-blue-600 text-sm font-medium py-1 px-3 rounded-full shadow-sm"
                    >
                        Headphones search
                    </button>
                </div>

                {/* Messages container */}
                <div className="flex-1 overflow-y-auto p-4 bg-white">
                    {messages.map((message, index) => (
                        <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : ''}`}>
                            {/* Regular message */}
                            {!message.recommendations && (
                                <div className={`inline-block p-3 rounded-lg max-w-3xl ${
                                    message.role === 'user'
                                        ? 'bg-blue-500 text-white rounded-br-none'
                                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                }`}>
                                    {message.content}
                                </div>
                            )}

                            {/* Recommendations display */}
                            {message.recommendations && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                    {message.recommendations.map((product) => (
                                        <div key={product.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-40 object-cover"
                                            />
                                            <div className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-lg">{product.name}</h3>
                                                    <span className="font-bold text-blue-600">${product.price}</span>
                                                </div>
                                                <div className="flex items-center mb-2">
                                                    <div className="flex text-yellow-400">
                                                        {'★'.repeat(Math.floor(product.rating))}
                                                        {'☆'.repeat(5 - Math.floor(product.rating))}
                                                    </div>
                                                    <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                                                </div>
                                                <ul className="text-sm text-gray-600 mb-3">
                                                    {product.features.slice(0, 3).map((feature, idx) => (
                                                        <li key={idx} className="flex items-start mb-1">
                                                            <span className="text-green-500 mr-1">✓</span>
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Ideal for: {product.idealFor.join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="bg-gray-100 p-3 rounded-lg text-gray-500">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input form */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ask about products..."
                            disabled={isTyping}
                        />
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg disabled:bg-blue-300"
                            disabled={isTyping || inputText.trim() === ''}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductRecommender;