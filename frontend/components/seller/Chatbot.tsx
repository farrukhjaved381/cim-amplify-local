"use client";
import { useState } from "react";

export default function Chatbot() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  const classifyCompany = async () => {
    if (!description || description.length < 20) {
      setError("Please share at least two full sentences about the company.");
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

      const responseText = await res.text();

      if (!res.ok) {
        let message = "We couldn't reach our AI helper. Please try again shortly.";
        try {
          const errorData = JSON.parse(responseText);
          if (errorData?.error) {
            message = errorData.error;
          }
        } catch (parseError) {
          // Ignore JSON parsing issues for error responses; show friendly message instead.
        }
        throw new Error(message);
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(
          "We couldn't read the AI reply. Please try again after checking the tips below."
        );
      }

      if (data.error) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "The AI couldn't finish the classification. Please try again in a moment."
        );
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
      const friendlyMessage =
        err instanceof Error && err.message
          ? err.message
          : "We couldn't finish that request. Please try again.";
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg w-full mx-auto">
      <h1 className="text-xl font-bold text-gray-800 text-center sm:text-2xl">
        🎯 M&A Industry Classifier
      </h1>
      <p className="text-center text-gray-500 mb-6 text-sm sm:text-base">
      Copy and paste the company description below and our AI will suggest the industry you should choose in Industry Selector.
      </p>
      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
        <p className="font-semibold">Tips for a clear answer:</p>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>Write two or more full sentences and end each one with a period.</li>
          <li>Describe what the company sells and who it serves.</li>
          <li>Avoid extra spaces or blank lines between sentences.</li>
        </ul>
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
          "🚀 Classify Description"
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
