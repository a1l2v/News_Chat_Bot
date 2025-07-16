/* eslint-disable prefer-const */
"use client";
import React, { useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createClientForClient } from "@/utils/supabase/client";
import { toast } from "sonner";

const Form = () => {
  const supabase = createClientForClient();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [loading, setLoading] = React.useState(false);
  const [loading2, setLoading2] = React.useState(false);

  const handleSubmit = async () => {
    const content = inputRef.current?.value;
    if (content && content.trim()) {
      try {
        setLoading(true);
        const result = await fetch(location.origin + "/embedding", {
          method: "POST",
          body: JSON.stringify({ text: content }),
        });
        if (result.status !== 200) {
          const errorMessage = await result.text();
          toast(`Error: ${errorMessage}`);
          setLoading(false);
          return;
        }
        const response = await result.json();
        const token = response.token;
        const embedding = response.embedding;
        const created_at = new Date().toISOString().split("T")[0];
        const { error } = await supabase.from("documents").insert({
          content,
          embedding,
          token,
          created_at,
        });
        if (error) {
          toast(`Error: ${error.message}`);
          setLoading(false);
          return;
        } else {
          toast("Dataset added successfully!");
        }

        inputRef.current!.value = ""; // Clear the textarea after submission
        setLoading(false);
      } catch (error) {
        toast(`Error: ${error}`);
        setLoading(false);
      }
    }
  };
  const handleUpdateNews = () => {
    setLoading2(true);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = yesterday.toISOString().split("T")[0];
    let url =
      "https://newsapi.org/v2/everything?" +
      "q=Apple&" +
      `from=${formattedDate}&` +
      "sortBy=popularity&" +
      "apiKey=169b438f313848ada30f72d1ef5b61d1";
    fetch(url)
      .then((response) => response.json())
      .then(async (data) => {
        toast("Daily news updated successfully!");
        console.log(data);
        let total_token = 0;
        if (!data.articles || data.articles.length === 0) {
          toast("No articles found.");
          setLoading2(false);
          return;
        }
        for (let i = 0; i < data.articles.length; i++) {
          if (total_token > 10000) {
            toast("Token limit exceeded. Please refine your search.");
            setLoading2(false);
            return;
          }
          const news = data.articles[i];
          const { title ,description,publishedAt,urlToImage } = news;
          const content = `${title}///${description}` ;
          const result = await fetch(location.origin + "/embedding", {
            method: "POST",
            body: JSON.stringify({ text: content }),
          });
          if (result.status !== 200) {
            const errorMessage = await result.text();
            toast(`Error: ${errorMessage}`);
            setLoading2(false);
            return;
          }
          const response = await result.json();
          const token = response.token;
          const embedding = response.embedding;
          const created_at = new Date(publishedAt.slice(0, 10)).toISOString().split("T")[0];
          const { error } = await supabase.from("documents").insert({
            content,
            embedding,
            token,
            created_at,
            url:urlToImage,
          });
          toast(`created_at: ${created_at}`);
          total_token += token;
          if (error) {
            toast(`Error: ${error.message}`);
            setLoading2(false);
            return;
          }
        }
        setLoading2(false);
      })
      .catch((error) => {
        toast(`Error: ${error.message}`);
        setLoading2(false);
      });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          News Content
        </label>
        <Textarea 
          className="h-96 bg-gray-700 border-gray-600 text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
          placeholder="Add the dataset content here..." 
          ref={inputRef} 
        />
      </div>
      
      <div className="space-y-3">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={handleSubmit} 
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Submitting...</span>
            </div>
          ) : (
            "Submit Dataset"
          )}
        </Button>
        
        <Button 
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={handleUpdateNews} 
          disabled={loading2}
        >
          {loading2 ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Loading...</span>
            </div>
          ) : (
            "Update Daily News"
          )}
        </Button>
      </div>
    </div>
  );
};

export default Form;
