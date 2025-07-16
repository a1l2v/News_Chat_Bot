/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useRef } from "react";
import { signOut } from "@/utils/actions";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { BsRobot } from "react-icons/bs";
import { PiSealQuestionThin } from "react-icons/pi";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { toast } from "sonner";
import { createClientForClient } from "@/utils/supabase/client";
import { oneLine, stripIndent } from "common-tags";
import Image from "next/image";

const Search = () => {
  const [questions, setQuestions] = React.useState<string[]>([]);
  const [answers, setAnswers] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [initialNews, setInitialNews] = React.useState<any[]>([]);
  const [newsLoading, setNewsLoading] = React.useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const supabase = createClientForClient();

  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch initial 3 news items on component mount
  React.useEffect(() => {
    const fetchInitialNews = async () => {
      try {
        const { data: news, error } = await supabase
          .from("documents")
          .select("content, url")
          .limit(30);

        if (error) {
          console.error("Error fetching initial news:", error);
        } else {
          setInitialNews(news || []);
        }
      } catch (error) {
        console.error("Error fetching initial news:", error);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchInitialNews();
  }, [supabase]);

  // Extract title from content (format: "title///description")
  const extractTitle = (content: string) => {
    if (!content) return "No title available";
    const parts = content.split("///");
    return parts[0]?.trim() || "No title available";
  };

  // Handle click on news card
  const handleNewsClick = (news: any) => {
    if (inputRef.current) {
      inputRef.current.value = `explain ${extractTitle(
        news.content
      )} in detail`;
      handleSearch();
    }
  };

  // Navigate news carousel
  const handleNext = () => {
    setCurrentIndex((prevIndex) => {
      const maxIndex = Math.max(0, initialNews.length - 3);
      return prevIndex + 3 <= maxIndex ? prevIndex + 3 : maxIndex;
    });
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 3 >= 0 ? prevIndex - 3 : 0));
  };

  // Get currently visible news items
  const visibleNews = initialNews.slice(currentIndex, currentIndex + 3);

  // Helper: Parse "give me news from [date] and [number] news"
  const parseNewsQuery = (text: string) => {
    // Example: "give me news from 2024-07-15 and 5 news"
    const regex = /give me news from (\d{4}-\d{2}-\d{2}) and (\d+) news/i;
    const match = text.match(regex);
    if (match) {
      return { date: match[1], count: parseInt(match[2], 10) };
    }
    return null;
  };

  const handleSearch = async () => {
    setLoading(true);
    const searchtext = inputRef.current?.value;
    if (searchtext && searchtext.trim()) {
      setQuestions([...questions, searchtext]);

      // Check for special news query
      const newsQuery = parseNewsQuery(searchtext);
      if (newsQuery) {
        // Query Supabase for news from the given date, limit by count
        const { data: news, error } = await supabase
          .from("documents")
          .select("content,created_at")
          .gte("created_at", `${newsQuery.date}T00:00:00`)
          .lte("created_at", `${newsQuery.date}T23:59:59`)
          .limit(newsQuery.count);

        if (error) {
          toast.error(`Error: ${error.message}`);
          setAnswers([
            ...answers,
            "Sorry, there was an error fetching the news.",
          ]);
        } else if (!news || news.length === 0) {
          toast.error("No news found for that date.");
          setAnswers([...answers, "No news found for that date."]);
        } else {
          toast.success("News fetched successfully!");
          const newsList = news
            .map((n: any, i: number) => `${i + 1}. ${n.content}`)
            .join("\n\n");
          setAnswers([...answers, newsList]);
        }
        setLoading(false);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      // Default: Embedding-based search
      const result = await fetch(location.origin + "/embedding", {
        method: "POST",
        body: JSON.stringify({ text: searchtext.replace(/\n/g, " ") }),
      });
      if (result.status !== 200) {
        const errorMessage = await result.text();
        toast.error(`Error: ${errorMessage}`);
        setLoading(false);
        return;
      } else {
        const data = await result.json();
        if (data.error) {
          toast.error(`Error: ${data.error}`);
        } else {
          toast.success("Embedding generated successfully!");
          const { data: documents } = await supabase.rpc("match_documents", {
            query_embedding: data.embedding,
            match_threshold: 0.4,
            match_count: 3,
          });
          toast.success("Search completed successfully!");
          let total_token = 0;
          let content = "";
          if (!documents || documents.length === 0) {
            toast.error("No documents found.");
            setAnswers([
              ...answers,
              "Sorry, I don't know how to help with that.",
            ]);
            setLoading(false);
            inputRef.current!.value = "";
            return;
          }
          for (let i = 1; i <= documents.length; i++) {
            if (total_token > 1000) {
              toast.error("Token limit exceeded. Please refine your search.");
              setAnswers([
                ...answers,
                "Token limit exceeded. Please refine your search.",
              ]);
              setLoading(false);
              inputRef.current!.value = "";
              return;
            }
            const doc = documents[i - 1];
            total_token += doc.token;
            content += `${doc.content}\n--\n`;
          }
          if (content.trim()) {
            const prompt = generatePrompt(content, searchtext);
            const answer = await getanswer(prompt);
            if (answer) {
              toast.success("Answer retrieved successfully!");
            }
          } else {
            setAnswers([
              ...answers,
              "Sorry, I don't know how to help with that.",
            ]);
          }
        }
      }
    }
    setLoading(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const getanswer = async (prompt: string) => {
    const data = await fetch(location.origin + "/chat", {
      method: "POST",
      body: JSON.stringify({ prompt: prompt }),
    });
    const result = await data.json();
    if (result.error) {
      console.error(result.error);
    } else {
      toast.success("Chat completed successfully!");
    }
    setAnswers([...answers, result.choices[0].text]);
    return result.choices[0].text;
  };

  const generatePrompt = (contextText: string, searchText: string) => {
    const prompt = stripIndent`
  You are an intelligent and helpful News AI assistant.

  Task:
  - First, if the user's question is in a language other than English, translate it into English before proceeding.
  - Using only the following Context sections from recent news articles,
    answer the Question below.
  - Your answer must also be in English, regardless of the input language.
  - If the exact answer is clearly present in the Context, reply only with that answer.
  - If the answer cannot be found in the provided Context, respond with:
    "I couldn't find any relevant information in the current news context."
  - Format your response in Markdown.

  Context:
  ${contextText}

  Question:
  """
  ${searchText}
  """

  Answer:
`;
    return prompt;
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-600 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <BsRobot className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-semibold text-gray-100">News AI</h1>
          </div>
          <Button
            onClick={signOut}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
          >
            Logout
          </Button>
        </div>

        {/* Initial News Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Latest News
          </h2>
          {newsLoading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
              <span>Loading news...</span>
            </div>
          ) : (
            <div className="relative">
              {/* Navigation arrows */}
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-full shadow-lg transition-all duration-200"
              >
                <FaChevronLeft className="w-4 h-4 text-gray-300" />
              </button>
              
              <button
                onClick={handleNext}
                disabled={currentIndex >= initialNews.length - 3}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-full shadow-lg transition-all duration-200"
              >
                <FaChevronRight className="w-4 h-4 text-gray-300" />
              </button>
              
              {/* News cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-8">
                {visibleNews.map((news, index) => (
                  <div
                    key={currentIndex + index}
                    className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden hover:border-blue-400 transition-colors duration-200 cursor-pointer"
                    onClick={() => handleNewsClick(news)}
                  >
                    <div className="aspect-video bg-gray-700 relative">
                      {news.url ? (
                        <Image
                          src={news.url}
                          alt={extractTitle(news.content)}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span>No image available</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-gray-200 font-medium line-clamp-3">
                        {extractTitle(news.content)}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination indicator */}
              <div className="flex justify-center mt-4 space-x-2">
                {Array.from({ length: Math.ceil(initialNews.length / 3) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index * 3)}
                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                      Math.floor(currentIndex / 3) === index
                        ? 'bg-blue-400'
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {questions.map((question, index) => {
            const answer = answers[index];
            const isLoading = loading && !answer;

            return (
              <div className="space-y-3" key={index}>
                <div className="flex items-start gap-3">
                  <PiSealQuestionThin className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-lg font-medium text-gray-200 mb-2">
                      {question}
                    </h2>
                    <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      {isLoading ? (
                        <div className="flex items-center gap-2 text-gray-400">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                          <span>Loading...</span>
                        </div>
                      ) : (
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {answer}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-600">
        <Input
          ref={inputRef}
          placeholder={`Ask Question  "give me news from [date] and [number] news "`}
          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
      </div>
    </>
  );
};

export default Search;
