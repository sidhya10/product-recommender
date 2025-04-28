import { useState, useRef, useEffect } from 'react';
import _ from 'lodash';
import OpenAI from 'openai';

const ProductRecommender = () => {
    // Initialize the OpenAI client
    const openai = new OpenAI({
        apiKey: process.env.REACT_APP_OPENAI_API_KEY, // Store this in .env file
        dangerouslyAllowBrowser: true // Only use this for development!
    });

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

    // Products database remains the same as your original code
    const products = [
        // Your product data here
    ];

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Function to call OpenAI API
    const generateAIResponse = async (userMessage, context) => {
        try {
            const chatCompletion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a product recommendation assistant helping customers find the perfect tech product. 
                        Current conversation context: ${JSON.stringify(context)}.
                        Keep responses concise and focused on helping the user find a product.`
                    },
                    ...messages.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    })),
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            });

            return chatCompletion.choices[0].message.content;
        } catch (error) {
            console.error("Error calling OpenAI:", error);
            return "I'm having trouble connecting to my AI services. Let me help you with my built-in recommendations instead.";
        }
    };

    // Process user message and generate response
    const processMessage = async (userMessage) => {
        // Add user message to chat
        setMessages(prevMessages => [...prevMessages, { role: 'user', content: userMessage }]);

        // Show typing indicator
        setIsTyping(true);

        // Get AI response
        const aiResponse = await generateAIResponse(userMessage, productContext);

        // Process the AI response for product insights
        let newContext = { ...productContext };

        // Simple parsing of AI response to extract product category
        const lowercaseResponse = aiResponse.toLowerCase();
        if (productContext.stage === 'initial') {
            if (lowercaseResponse.includes('laptop')) {
                newContext.category = 'laptop';
                newContext.stage = 'budget';
            } else if (lowercaseResponse.includes('smartphone') || lowercaseResponse.includes('phone')) {
                newContext.category = 'smartphone';
                newContext.stage = 'budget';
            } else if (lowercaseResponse.includes('headphones') || lowercaseResponse.includes('earbuds')) {
                newContext.category = 'headphones';
                newContext.stage = 'budget';
            }
        } else if (productContext.stage === 'budget') {
            // Extract budget with regex
            const budgetRegex = /\$?(\d+)(?:\s*-\s*\$?(\d+))?/;
            const budgetMatch = userMessage.match(budgetRegex);

            if (budgetMatch) {
                if (budgetMatch[2]) {
                    const minBudget = parseInt(budgetMatch[1]);
                    const maxBudget = parseInt(budgetMatch[2]);
                    newContext.budget = { min: minBudget, max: maxBudget };
                } else {
                    const maxBudget = parseInt(budgetMatch[1]);
                    newContext.budget = { max: maxBudget };
                }
                newContext.stage = 'preferences';
            }
        } else if (productContext.stage === 'preferences') {
            // Store user preferences
            newContext.preferences.push(userMessage);
            newContext.stage = 'recommendation';

            // Add AI response to chat
            setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: aiResponse }]);

            // Generate product recommendations
            const recommendations = generateRecommendations(newContext);

            // Add recommendations to chat
            setTimeout(() => {
                setMessages(prevMessages => [
                    ...prevMessages,
                    {
                        role: 'assistant',
                        content: 'Based on your preferences, here are my top recommendations:'
                    },
                    {
                        role: 'assistant',
                        content: '',
                        recommendations
                    }
                ]);

                // Reset context for new conversation
                setProductContext({
                    ...newContext,
                    stage: 'feedback'
                });

                setIsTyping(false);
            }, 1000);

            return;
        } else if (productContext.stage === 'feedback') {
            // Handle feedback stage
            if (lowercaseResponse.includes('new search') || lowercaseResponse.includes('start over')) {
                newContext = {
                    category: null,
                    budget: null,
                    preferences: [],
                    stage: 'initial'
                };
            }
        }

        // Update context
        setProductContext(newContext);

        // Add AI response to chat
        setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: aiResponse }]);

        // Hide typing indicator
        setIsTyping(false);
    };

    // Function to generate recommendations based on context
    const generateRecommendations = (context) => {
        // Filter products based on category
        let filteredProducts = products.filter(p => p.category === context.category);

        // Filter by budget if available
        if (context.budget) {
            if (context.budget.min && context.budget.max) {
                filteredProducts = filteredProducts.filter(p =>
                    p.price >= context.budget.min && p.price <= context.budget.max
                );
            } else if (context.budget.max) {
                filteredProducts = filteredProducts.filter(p => p.price <= context.budget.max);
            }
        }

        // Simple preference matching - would be more sophisticated in a real app
        if (context.preferences.length > 0) {
            const preferencesText = context.preferences.join(' ').toLowerCase();

            // Score products based on how well they match preferences
            filteredProducts = filteredProducts.map(product => {
                let score = 0;
                // Check features
                product.features.forEach(feature => {
                    if (preferencesText.includes(feature.toLowerCase())) {
                        score += 2;
                    }
                });

                // Check idealFor
                product.idealFor.forEach(idealFor => {
                    if (preferencesText.includes(idealFor.toLowerCase())) {
                        score += 1;
                    }
                });

                return { ...product, score };
            }).sort((a, b) => b.score - a.score || b.rating - a.rating);
        }

        // Take top 3 or fewer recommendations
        return filteredProducts.slice(0, 3);
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