import { Box } from "@mui/material";
import * as React from "react";
import { CodeBlock, obsidian } from "react-code-blocks";

const MultiLine = (props: {
    language?: string;
    children: any;
    noNumber?: boolean;
}) => {
    return (
        <Box sx={{ m: 2 }} className="cb">
            <CodeBlock
                text={props.children as string}
                language={props.language || ""}
                theme={obsidian}
                showLineNumbers={!props.noNumber}
            />
        </Box>
    );
};

export default MultiLine;
