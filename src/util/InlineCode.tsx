import { Box } from "@mui/material";
import * as React from "react";
import { obsidian } from "react-code-blocks";
import { Code } from "react-code-blocks";

const Inline = (props: { language?: string; children: any }) => {
    return (
        <Box className="cbi" sx={{ maxWidth: "100" }}>
            <Code
                text={props.children as string}
                language={props.language || ""}
                theme={obsidian}
            />
        </Box>
    );
};

export default Inline;
