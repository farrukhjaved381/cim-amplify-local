"use client";
import { useState } from "react";

export default function Classifier() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exampleText =
    "A leading window manufacturer known for its high-quality, energy-efficient windows, designed specifically for southern climates. With a focus on custom and factory-direct solutions, the Company excels in providing fast lead times, superior craftsmanship, and excellent customer service.";

  const fillExample = () => {
    setDescription(exampleText);
  };

  const classifyCompany = async () => {
    if (!description || description.length < 20) {
      setError("Please provide a more detailed company description.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `API Error: ${res.status}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Validate the response from the AI
      if (!data.classification || typeof data.classification !== 'string' || !data.classification.includes('→')) {
        const reasoning = data.reasoning 
          ? `AI's reasoning: ${data.reasoning}` 
          : "The AI could not process the description. Please try rephrasing it with more detail and correct punctuation.";
        throw new Error(reasoning);
      }
      
      const [category, subcategory] = data.classification.split(" → ");
      setResult({ ...data, category, subcategory });

    } catch (err: any) {
      setError(`Classification failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 text-center">
        🎯 M&A Industry Classifier
      </h1>
      <p className="text-center text-gray-500 mb-6">
        Automatically classify companies using our comprehensive M&A taxonomy
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-700 mb-2">💡 Example</h4>
        <p
          className="italic text-gray-600 cursor-pointer hover:text-gray-800"
          onClick={fillExample}
        >
          "{exampleText}"
        </p>
      </div>

      <div className="mb-4">
        <label
          htmlFor="companyDescription"
          className="block mb-2 font-semibold text-gray-700"
        >
          Company Description
        </label>
        <textarea
          id="companyDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full h-32 p-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Paste or type the company description here..."
          maxLength={2000}
        ></textarea>
      </div>

      <button
        onClick={classifyCompany}
        disabled={loading}
        className="w-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:-translate-y-0.5 transform transition-all duration-300 ease-in-out hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        {loading ? (
          <>
            <div className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Analyzing...
          </>
        ) : (
          "🚀 Classify Company"
        )}
      </button>

      {error && (
        <div className="mt-4 bg-red-100 border border-red-200 text-red-700 p-3 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-l-4 border-green-500">
          <div className="text-lg font-bold text-gray-800 mb-3">
            <span className="text-red-600">{result.category}</span> →{" "}
            <span className="text-purple-600">{result.subcategory}</span>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">
              Classification Reasoning:
            </h4>
            <p className="text-gray-600 leading-relaxed">{result.reasoning}</p>
          </div>
        </div>
      )}
    </div>
  );
}