"use client";

import { CheckCircle, XCircle, MinusCircle, Trophy, Sparkles, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import classNames from "classnames";

type WinnerType = "yes" | "no" | "abstain" | "tie";

interface VoteResultCardProps {
  results: {
    yes: number;
    no: number;
    abstain: number;
  };
}

export const VoteResultCard = ({ results }: VoteResultCardProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const total = results.yes + results.no + results.abstain;
  const yesPercentage = total > 0 ? (results.yes / total) * 100 : 0;
  const noPercentage = total > 0 ? (results.no / total) * 100 : 0;

  const getWinner = () => {
    if (results.yes > results.no) return "yes";
    if (results.no > results.yes) return "no";
    return "tie";
  };

  const winner: WinnerType = getWinner();

  const getWinnerConfig = () => {
    switch (winner) {
      case "yes":
        return {
          percentage: yesPercentage,
        };
      case "no":
        return {
          percentage: noPercentage,
        };
      case "tie":
        return {
          percentage: 50,
        };
    }
  };

  const config = getWinnerConfig();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const votingTextClasses = {
    yes: "text-voting-yes",
    no: "text-voting-no",
    abstain: "text-voting-abstain",
    tie: "text-voting-slate",
  };

  const votingBgClasses = {
    yes: "bg-voting-yes/10 border-voting-yes",
    no: "bg-voting-no/10 border-voting-no",
    abstain: "bg-voting-abstain/10 border-voting-abstain",
    tie: "bg-voting-slate/10 border-voting-slate",
  };

  const textClass = (status: WinnerType) => {
    if (status === winner) return votingTextClasses[winner];
    return votingTextClasses.abstain;
  };

  const bgClass = (status: WinnerType) => {
    if (status === winner) return votingBgClasses[winner];
    return votingBgClasses.abstain;
  };

  if (!config) {
    return null;
  }

  return (
    <div
      className={`transition-all delay-100 duration-1000 ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
    >
      <div className="shadow-2xl bg-white/80 border-0">
        <div className="flex flex-col gap-2">
          <div className="relative">
            <div className="text-left">
              <div
                className={classNames(`text-lg`, textClass(winner))}
                style={{
                  fontWeight: 700,
                }}
              >
                {config?.percentage.toFixed(0)}%{" "}
                {winner === "yes" ? "Approval" : winner === "no" ? "Opposition" : "Split"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
            <div className={`p-4 text-center ${bgClass("yes")} rounded-xl border`}>
              <CheckCircle className={classNames(`mx-auto h-5 w-5`, textClass("yes"))} />
              <div
                className={`font-bold text-2xl ${textClass("yes")}`}
                style={{
                  fontWeight: winner === "yes" ? 700 : winner === "no" ? 700 : 400,
                }}
              >
                {results.yes}
              </div>
              <div className={`text-sm ${textClass("yes")}`}>Yes</div>
            </div>

            <div className={`p-4 text-center ${bgClass("no")} rounded-xl border`}>
              <XCircle className={classNames(`mx-auto h-5 w-5`, textClass("no"))} />
              <div
                className={`font-bold text-2xl ${textClass("no")}`}
                style={{
                  fontWeight: winner === "no" ? 700 : winner === "yes" ? 700 : 400,
                }}
              >
                {results.no}
              </div>
              <div className={`text-sm ${textClass("no")}`}>No</div>
            </div>

            <div className={`p-4 text-center ${bgClass("abstain")} rounded-xl border`}>
              <MinusCircle className={classNames(`mx-auto h-5 w-5`, textClass("abstain"))} />
              <div
                className={`font-bold text-2xl ${textClass("abstain")}`}
                style={{
                  fontWeight: 400,
                }}
              >
                {results.abstain}
              </div>
              <div className={`text-sm ${textClass("abstain")}`}>Abstain</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
