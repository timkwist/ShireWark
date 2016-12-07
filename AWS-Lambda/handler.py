def handler(event, context):
    """
    This function fetches content from mysql RDS instance
    """
    import sys
    import logging
    import pymysql
    #rds settings
    rds_host  = "testdb.cfqoihxvykuz.us-west-2.rds.amazonaws.com"
    name = "root"
    password = "password"
    db_name = "test"
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    try:
        conn = pymysql.connect(rds_host, user=name, passwd=password, db=db_name, connect_timeout=3)
        logger.info("SUCCESS: Connection to RDS mysql instance succeeded")
    except Exception as e:
        return "Error: %s" % e

    items = list()
    with conn.cursor() as cur:
        if "source" in event: # Single object POST request
            try:
                cur.execute("insert into shirewark (source, dest, Num_packets, Size_packets) values ('%s', '%s', '%d', '%d')" % 
                (event["source"], event["dest"], event["Num_packets"], event["Size_packets"]))
                conn.commit()
                return "success"
            except Exception as e:
                return "Failure: %s" % e
        elif "events" in event: # Multiple object POST request
            try:
                y = event["events"]
                # For every object in the array, insert it into the database
                for x in y:
                    cur.execute("insert into shirewark (source, dest, Num_packets, Size_packets) values ('%s', '%s', '%d', '%d')" % 
                    (x["source"], x["dest"], x["Num_packets"], x["Size_packets"]))
                    conn.commit()
                return "success"
            except Exception as e:
                return "Failure: %s" % e
        elif event.get("where"): # GET request with where parameter
            try:
                # Change the time zone of the current session
                # This allows the visualizer to see the date timestamp in PST rather than UTC
                cur.execute("SET time_zone = '-08:00'")
                # Select all rows from the database that match the given where string
                cur.execute("select * from shirewark where %s" % event["where"])
                for row in cur:
                    # Set the date to isoformat so that it is uniform
                    # This also ensures that it can be serialized in JSON
                    new_time = row[0].isoformat()
                    row = {"date":new_time, "source":row[1], "dest":row[2], "Num_packets":row[3], "Size_packets":row[4]}
                    items.append(row)
                    logger.info(row)
                return items
            except Exception as e:
                return "Failure: %s" % e
        elif "clear" in event: # /clear GET request
            try:
                # Clear the table of all rows
                cur.execute("TRUNCATE TABLE shirewark")
                return "success"
            except Exception as e:
                return "Failure: %s" % e
        else: # GET request without where
            try:
                # Change the time zone of the current session
                # This allows the visualizer to see the date timestamp in PST rather than UTC
                cur.execute("SET time_zone = '-08:00'")
                # Select all rows from the database
                cur.execute("select * from shirewark")
                for row in cur:
                    # Set the date to isoformat so that it is uniform
                    # This also ensures that it can be serialized in JSON
                    new_time = row[0].isoformat()
                    row = {"date":new_time, "source":row[1], "dest":row[2], "Num_packets":row[3], "Size_packets":row[4]}
                    items.append(row)
                    logger.info(row)
                return items
            except Exception as e:
                return "Failure: %s" % e
