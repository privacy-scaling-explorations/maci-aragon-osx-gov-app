import { Button, IconType, Icon, InputText, TextAreaRichText, InputDate, InputTime } from "@aragon/ods";
import React, { useEffect, useState } from "react";
import { uploadToPinata } from "@/utils/ipfs";
import { useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { toHex } from "viem";
import { MaciVotingAbi } from "../artifacts/MaciVoting.sol";
import { useAlerts } from "@/context/Alerts";
import WithdrawalInput from "@/components/input/withdrawal";
import { FunctionCallForm } from "@/components/input/function-call-form";
import { type Action } from "@/utils/types";
import { useRouter } from "next/router";
import { Else, ElseIf, If, Then } from "@/components/if";
import { PleaseWaitSpinner } from "@/components/please-wait";
import { PUBLIC_CHAIN, PUBLIC_MACI_VOTING_PLUGIN_ADDRESS } from "@/constants";
import { ActionCard } from "@/components/actions/action";

enum ActionType {
  Signaling,
  Withdrawal,
  Custom,
}

export default function Create() {
  const { push } = useRouter();
  const { switchChainAsync } = useSwitchChain();
  const chainId = useChainId();
  const [title, setTitle] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [actions, setActions] = useState<Action[]>([]);
  const { addAlert } = useAlerts();
  const { writeContract: createProposalWrite, data: createTxHash, status, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: createTxHash });
  const [actionType, setActionType] = useState<ActionType>(ActionType.Signaling);

  const isLoading = status === "pending" || isConfirming;

  const changeActionType = (actionType: ActionType) => {
    setActions([]);
    setActionType(actionType);
  };

  useEffect(() => {
    if (status === "idle" || status === "pending") return;
    else if (status === "error") {
      if (error?.message?.startsWith("User rejected the request")) {
        addAlert("Transaction rejected by the user", {
          timeout: 4 * 1000,
        });
        return;
      } else {
        // eslint-disable-next-line no-console
        console.error(error);
        addAlert("Could not create the proposal", { type: "error" });
      }
      return;
    }

    // success
    if (!createTxHash) return;
    else if (isConfirming) {
      addAlert("Proposal submitted", {
        description: "Waiting for the transaction to be validated",
        txHash: createTxHash,
      });
      return;
    } else if (!isConfirmed) return;

    addAlert("Proposal created", {
      description: "The transaction has been validated",
      type: "success",
      txHash: createTxHash,
    });

    setTimeout(() => {
      push("#/");
    }, 1000 * 2);
    // adding addAlert causes multiple re-renders of the toast messeage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, createTxHash, isConfirming, isConfirmed, error, push]);

  const submitProposal = async () => {
    // Check metadata
    if (!title.trim())
      return addAlert("Invalid proposal details", {
        description: "Please, enter a title",
        type: "error",
      });

    if (!summary.trim())
      return addAlert("Invalid proposal details", {
        description: "Please, enter a summary of what the proposal is about",
        type: "error",
      });

    // Check the action
    switch (actionType) {
      case ActionType.Signaling:
        break;
      case ActionType.Withdrawal:
        if (!actions.length) {
          return addAlert("Invalid proposal details", {
            description: "Please ensure that the withdrawal address and the amount to transfer are valid",
            type: "error",
          });
        }
        break;
      default:
        if (!actions.length || !actions[0].data || actions[0].data === "0x") {
          return addAlert("Invalid proposal details", {
            description: "Please ensure that the values of the action to execute are complete and correct",
            type: "error",
          });
        }
    }

    const proposalMetadataJsonObject = {
      title,
      summary,
      description,
      resources: [{ name: "Aragon", url: "https://aragon.org" }],
    };
    const blob = new Blob([JSON.stringify(proposalMetadataJsonObject)], {
      type: "application/json",
    });

    const ipfsPin = await uploadToPinata(blob);

    if (!startDate || !endDate) {
      addAlert("You need to specify the start date and end date of the voting period", {
        timeout: 4 * 1000,
      });
      return;
    }

    const startDateTime = Math.floor(new Date(`${startDate}T${startTime ? startTime : "00:00:00"}`).getTime() / 1000);
    const endDateTime = Math.floor(new Date(`${endDate}T${endTime ? endTime : "00:00:00"}`).getTime() / 1000);

    if (chainId !== PUBLIC_CHAIN.id) await switchChainAsync({ chainId: PUBLIC_CHAIN.id });
    createProposalWrite({
      chainId: PUBLIC_CHAIN.id,
      abi: MaciVotingAbi,
      address: PUBLIC_MACI_VOTING_PLUGIN_ADDRESS,
      functionName: "createProposal",
      // args: _metadata, _actions, _allowFailureMap, _startDate, _endDate
      args: [toHex(ipfsPin), actions, BigInt(0), BigInt(startDateTime), BigInt(endDateTime)],
    });
  };

  const handleTitleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event?.target?.value);
  };

  const handleSummaryInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSummary(event?.target?.value);
  };

  const showLoading = status === "pending" || isConfirming;

  return (
    <section className="flex w-screen min-w-full max-w-full flex-col items-center px-4 py-6 md:w-4/5 md:p-6 lg:w-2/3 xl:py-10 2xl:w-3/5">
      <div className="mb-6 w-full content-center justify-between">
        <h1 className="mb-10 text-3xl font-semibold text-neutral-900">Create Proposal</h1>
        <div className="mb-6">
          <InputText
            className=""
            label="Title"
            maxLength={100}
            placeholder="A short title that describes the main purpose"
            variant="default"
            value={title}
            onChange={handleTitleInput}
          />
        </div>
        <div className="mb-6">
          <InputText
            className=""
            label="Summary"
            maxLength={240}
            placeholder="A short summary that describes the main purpose"
            variant="default"
            value={summary}
            onChange={handleSummaryInput}
          />
        </div>
        <div className="mb-6">
          <TextAreaRichText
            label="Description"
            className="pt-2"
            value={description}
            onChange={setDescription}
            placeholder="A description for what the proposal is all about"
          />
        </div>
        <div className="mb-6 flex flex-row gap-x-5">
          <div className="flex flex-1 flex-col">
            <InputDate
              className="w-full"
              label="Start date"
              variant="default"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <InputTime
              className="w-full"
              variant="default"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="flex flex-1 flex-col">
            <InputDate
              className="w-full"
              label="End date"
              variant="default"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <InputTime
              className="w-full"
              variant="default"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
        <div className="mb-6">
          <span className="mb-2 block text-lg font-normal text-neutral-900 ">Select the type of proposal</span>
          <div className="mt-2 grid h-24 grid-cols-3 gap-5">
            <div
              onClick={() => {
                changeActionType(ActionType.Signaling);
              }}
              className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-solid bg-neutral-0 hover:bg-neutral-50 ${
                actionType === ActionType.Signaling ? "border-primary-300" : "border-neutral-100"
              }`}
            >
              <Icon
                className={`mt-2 !h-12 !w-10 p-2 ${
                  actionType === ActionType.Signaling ? "text-primary-400" : "text-neutral-400"
                }`}
                icon={IconType.INFO}
                size="lg"
              />
              <span className="text-center text-sm text-neutral-400">Signaling</span>
            </div>
            <div
              onClick={() => changeActionType(ActionType.Withdrawal)}
              className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-solid bg-neutral-0 hover:bg-neutral-50 ${
                actionType === ActionType.Withdrawal ? "border-primary-300" : "border-neutral-100"
              }`}
            >
              <Icon
                className={`mt-2 !h-12 !w-10 p-2 ${
                  actionType === ActionType.Withdrawal ? "text-primary-400" : "text-neutral-400"
                }`}
                icon={IconType.WITHDRAW}
                size="lg"
              />
              <span className="text-center text-sm text-neutral-400">DAO Payment</span>
            </div>
            <div
              onClick={() => changeActionType(ActionType.Custom)}
              className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-solid bg-neutral-0 hover:bg-neutral-50 ${
                actionType === ActionType.Custom ? "border-primary-300" : "border-neutral-100"
              }`}
            >
              <Icon
                className={`mt-2 !h-12 !w-10 p-2 ${actionType === ActionType.Custom ? "text-primary-400" : "text-neutral-400"}`}
                icon={IconType.BLOCKCHAIN_BLOCKCHAIN}
                size="lg"
              />
              <span className="text-center text-sm text-neutral-400">Custom action</span>
            </div>
          </div>
          <div className="mb-6">
            {actionType === ActionType.Withdrawal && <WithdrawalInput setActions={setActions} />}
            {actionType === ActionType.Custom && (
              <FunctionCallForm onAddAction={(action) => setActions(actions.concat([action]))} />
            )}
          </div>
        </div>

        <If condition={showLoading}>
          <Then>
            <div className="mb-6 mt-14">
              <PleaseWaitSpinner fullMessage="Confirming transaction..." />
            </div>
          </Then>
          <ElseIf condition={actionType !== ActionType.Custom}>
            <Button className="mb-6 mt-14" size="lg" variant="primary" onClick={() => submitProposal()}>
              Submit proposal
            </Button>
          </ElseIf>
          <Else>
            <div className="mb-6 mt-14">
              <If not={actions.length}>
                <Then>
                  <p>Add the first action to continue</p>
                </Then>
                <Else>
                  <p className="flex-grow pb-3 text-lg font-semibold text-neutral-900">Actions</p>
                  <div className="mb-10">
                    {actions?.map?.((action, i) => (
                      <div className="mb-3" key={`${i}-${action.to}-${action.data}`}>
                        <ActionCard action={action} idx={i} />
                      </div>
                    ))}
                  </div>
                </Else>
              </If>
              <Button
                className="mt-3"
                size="lg"
                variant="primary"
                disabled={!actions.length}
                onClick={() => submitProposal()}
              >
                {isLoading ? <PleaseWaitSpinner fullMessage="Submitting proposal..." /> : "Submit proposal"}
              </Button>
            </div>
          </Else>
        </If>
      </div>
    </section>
  );
}
