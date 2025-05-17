export const MaciVotingAbi = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "EXECUTE_PERMISSION_ID",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "INT_STATE_TREE_DEPTH",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "STATE_TREE_DEPTH",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "UPGRADE_PLUGIN_PERMISSION_ID",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "VOTE_OPTION_TREE_DEPTH",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "canExecute",
    inputs: [
      {
        name: "_proposalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "checkerFactory",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IERC20VotesCheckerFactory",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "coordinatorPubKey",
    inputs: [],
    outputs: [
      {
        name: "x",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "y",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createProposal",
    inputs: [
      {
        name: "_metadata",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "_actions",
        type: "tuple[]",
        internalType: "struct IDAO.Action[]",
        components: [
          {
            name: "to",
            type: "address",
            internalType: "address",
          },
          {
            name: "value",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "data",
            type: "bytes",
            internalType: "bytes",
          },
        ],
      },
      {
        name: "_allowFailureMap",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_startDate",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "_endDate",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    outputs: [
      {
        name: "proposalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "customProposalParamsABI",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "dao",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IDAO",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "execute",
    inputs: [
      {
        name: "_proposalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getProposal",
    inputs: [
      {
        name: "_proposalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "proposal_",
        type: "tuple",
        internalType: "struct MaciVoting.Proposal",
        components: [
          {
            name: "active",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "executed",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "parameters",
            type: "tuple",
            internalType: "struct MaciVoting.ProposalParameters",
            components: [
              {
                name: "startDate",
                type: "uint64",
                internalType: "uint64",
              },
              {
                name: "endDate",
                type: "uint64",
                internalType: "uint64",
              },
              {
                name: "snapshotBlock",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "minVotingPower",
                type: "uint256",
                internalType: "uint256",
              },
            ],
          },
          {
            name: "tally",
            type: "tuple",
            internalType: "struct MaciVoting.TallyResults",
            components: [
              {
                name: "yes",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "no",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "abstain",
                type: "uint256",
                internalType: "uint256",
              },
            ],
          },
          {
            name: "actions",
            type: "tuple[]",
            internalType: "struct IDAO.Action[]",
            components: [
              {
                name: "to",
                type: "address",
                internalType: "address",
              },
              {
                name: "value",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "data",
                type: "bytes",
                internalType: "bytes",
              },
            ],
          },
          {
            name: "allowFailureMap",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "pollId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "pollAddress",
            type: "address",
            internalType: "address",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getVotingToken",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IVotesUpgradeable",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasSucceeded",
    inputs: [
      {
        name: "_proposalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "implementation",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "initialize",
    inputs: [
      {
        name: "_dao",
        type: "address",
        internalType: "contract IDAO",
      },
      {
        name: "_maci",
        type: "address",
        internalType: "address",
      },
      {
        name: "_coordinatorPubKey",
        type: "tuple",
        internalType: "struct DomainObjs.PublicKey",
        components: [
          {
            name: "x",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "y",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
      {
        name: "_votingSettings",
        type: "tuple",
        internalType: "struct IMaciVoting.VotingSettings",
        components: [
          {
            name: "minParticipation",
            type: "uint32",
            internalType: "uint32",
          },
          {
            name: "minDuration",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "minProposerVotingPower",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
      {
        name: "_token",
        type: "address",
        internalType: "contract IVotesUpgradeable",
      },
      {
        name: "_verifier",
        type: "address",
        internalType: "address",
      },
      {
        name: "_vkRegistry",
        type: "address",
        internalType: "address",
      },
      {
        name: "_policyFactory",
        type: "address",
        internalType: "address",
      },
      {
        name: "_checkerFactory",
        type: "address",
        internalType: "address",
      },
      {
        name: "_voiceCreditProxyFactory",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "maci",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract MACI",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "minParticipation",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint32",
        internalType: "uint32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "minProposerVotingPower",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pluginType",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum IPlugin.PluginType",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "policyFactory",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IERC20VotesPolicyFactory",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "proposalCount",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "protocolVersion",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8[3]",
        internalType: "uint8[3]",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "proxiableUUID",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "supportsInterface",
    inputs: [
      {
        name: "_interfaceId",
        type: "bytes4",
        internalType: "bytes4",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalVotingPower",
    inputs: [
      {
        name: "_blockNumber",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "upgradeTo",
    inputs: [
      {
        name: "newAddress",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "upgradeToAndCall",
    inputs: [
      {
        name: "newImplementation",
        type: "address",
        internalType: "address",
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "verifier",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vkRegistry",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "voiceCreditProxyFactory",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IInitialVoiceCreditsProxyFactory",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "votingSettings",
    inputs: [],
    outputs: [
      {
        name: "minParticipation",
        type: "uint32",
        internalType: "uint32",
      },
      {
        name: "minDuration",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "minProposerVotingPower",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AdminChanged",
    inputs: [
      {
        name: "previousAdmin",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "newAdmin",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "BeaconUpgraded",
    inputs: [
      {
        name: "beacon",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Initialized",
    inputs: [
      {
        name: "version",
        type: "uint8",
        indexed: false,
        internalType: "uint8",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "creator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "startDate",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
      {
        name: "endDate",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
      {
        name: "metadata",
        type: "bytes",
        indexed: false,
        internalType: "bytes",
      },
      {
        name: "actions",
        type: "tuple[]",
        indexed: false,
        internalType: "struct IDAO.Action[]",
        components: [
          {
            name: "to",
            type: "address",
            internalType: "address",
          },
          {
            name: "value",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "data",
            type: "bytes",
            internalType: "bytes",
          },
        ],
      },
      {
        name: "allowFailureMap",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ProposalExecuted",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Upgraded",
    inputs: [
      {
        name: "implementation",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "DaoUnauthorized",
    inputs: [
      {
        name: "dao",
        type: "address",
        internalType: "address",
      },
      {
        name: "where",
        type: "address",
        internalType: "address",
      },
      {
        name: "who",
        type: "address",
        internalType: "address",
      },
      {
        name: "permissionId",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
  },
  {
    type: "error",
    name: "DateOutOfBounds",
    inputs: [
      {
        name: "limit",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "actual",
        type: "uint64",
        internalType: "uint64",
      },
    ],
  },
  {
    type: "error",
    name: "NoVotingPower",
    inputs: [],
  },
  {
    type: "error",
    name: "NonexistentProposal",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "ProposalAlreadyExists",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "ProposalCreationForbidden",
    inputs: [
      {
        name: "_address",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "ProposalExecutionForbidden",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "RatioOutOfBounds",
    inputs: [
      {
        name: "limit",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "actual",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
] as const;
