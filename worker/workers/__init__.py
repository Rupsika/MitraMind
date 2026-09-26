from workers.reindex import handle_reindex

# job type -> handler
HANDLERS = {
    "reindex_knowledge_base": handle_reindex,
}
